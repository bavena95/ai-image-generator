// ai-image-generator/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API Key");
}
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const IMAGE_GENERATION_COST = 1; // Keep this, or pass it from client if dynamic

function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set(name: string, value: string, options: CookieOptions) {
                     try { cookieStore.set({ name, value, ...options }); } catch (error) { console.warn('Failed to set cookie in API route handler:', error); }
                },
                remove(name: string, options: CookieOptions) {
                     try { cookieStore.set({ name, value: '', ...options }); } catch (error) { console.warn('Failed to remove cookie in API route handler:', error); }
                },
            },
        }
    );
}

export async function POST(request: Request) {
  const supabase = createSupabaseClient();

  try {
    // 1. Verify User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    console.log(`User authenticated: ${userId}`);

    // 2. Get prompt from request body
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    console.log(`Generating image for prompt: "${prompt}" by user: ${userId}`);

    // OPTIONAL: Initial client-side optimistic credit check can still happen here,
    // but the database function will be the source of truth.
    // For this refactor, we'll let the DB function handle the definitive credit check.

    // 3. Call OpenAI API to generate the image
    console.log("Calling OpenAI API...");
    const openaiResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    const tempImageUrl = openaiResponse.data[0]?.url;
    if (!tempImageUrl) {
      throw new Error("Could not get temporary image URL from OpenAI");
    }
    console.log(`Temporary OpenAI URL received: ${tempImageUrl}`);

    // 4. Download image from temporary URL
    console.log("Downloading image from temporary URL...");
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from OpenAI: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();
    console.log("Image downloaded successfully.");

    // 5. Upload to Supabase Storage
    const fileExtension = imageBlob.type.split('/')[1] || 'png';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const storagePath = `${userId}/${uniqueFileName}`;

    console.log(`Uploading to Supabase Storage at: ${storagePath}`);
    const { error: uploadError } = await supabase.storage
      .from('generated_images')
      .upload(storagePath, imageBlob, { upsert: false });

    if (uploadError) {
      console.error("Error uploading to Supabase Storage:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
    console.log("Upload to Supabase Storage complete.");

    // 6. Call the Supabase function to save metadata and debit credits
    console.log(`Calling Supabase function process_image_generation for user ${userId}...`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('process_image_generation', {
        p_user_id: userId,
        p_prompt: prompt,
        p_image_url: storagePath, // Save the storage path
        p_model_used: "dall-e-3",
        p_generation_cost: IMAGE_GENERATION_COST
    });

    if (rpcError) {
      console.error("Error calling Supabase function process_image_generation:", rpcError);
      // Attempt to remove the orphaned image from storage as a compensation action
      // This is best-effort; a more robust compensation would involve a retry queue or manual cleanup process
      await supabase.storage.from('generated_images').remove([storagePath]);
      console.log(`Orphaned image ${storagePath} removed due to DB function error.`);
      throw new Error(`Failed to process image generation in DB: ${rpcError.message}`);
    }

    if (!rpcData || !rpcData.success) {
        console.error("Supabase function process_image_generation did not succeed:", rpcData?.error);
        // Attempt to remove the orphaned image
        await supabase.storage.from('generated_images').remove([storagePath]);
        console.log(`Orphaned image ${storagePath} removed due to DB function reported failure.`);
        const errorMessage = rpcData?.error || 'Failed to save image metadata or debit credits.';
        // Use 402 Payment Required if it's an insufficient credits error specifically
        if (errorMessage.toLowerCase().includes('insufficient credits')) {
            return NextResponse.json({ error: 'Insufficient credits.' }, { status: 402 });
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    console.log("Image metadata saved and credits debited via DB function. New credits:", rpcData.new_credits);
    // const imageId = rpcData.image_id; // If you need the ID of the inserted image record

    // 7. Generate Signed URL for the image in Supabase Storage
    console.log(`Generating signed URL for ${storagePath}...`);
    const expiresIn = 60 * 5; // URL valid for 5 minutes
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('generated_images')
      .createSignedUrl(storagePath, expiresIn);

    if (signedUrlError || !signedUrlData) {
      console.error("Error generating signed URL:", signedUrlError);
      throw new Error(`Failed to generate access URL for image: ${signedUrlError?.message}`);
    }
    console.log("Signed URL generated successfully.");

    // 8. Return the Signed URL to the frontend
    return NextResponse.json({ imageUrl: signedUrlData.signedUrl, newCredits: rpcData.new_credits }); // Optionally return new credit count

  } catch (error) {
    console.error("[API /api/generate ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const status = error instanceof OpenAI.APIError ? error.status : 500;
    // If the error is about insufficient credits (from our DB function check), send 402
    if (errorMessage.toLowerCase().includes('insufficient credits')) {
        return NextResponse.json({ error: 'Insufficient credits.' }, { status: 402 });
    }
    return NextResponse.json({ error: errorMessage }, { status: status ?? 500 });
  }
}