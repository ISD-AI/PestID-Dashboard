// app/api/get-suggestions/route.ts
import { Client } from '@gradio/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { imageBlobBase64 } = await req.json();

    if (!imageBlobBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const buffer = Buffer.from(imageBlobBase64, 'base64');
    const blob = new Blob([buffer], { type: 'image/jpeg' });

    const client = await Client.connect('imageomics/bioclip-demo');
    const result = await client.predict('/lambda', {
      img: blob,
      rank: 'Species',
    });

    return NextResponse.json({ data: result.data });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}