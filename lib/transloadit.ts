import crypto from 'crypto';

function signParams(params: any, secret: string) {
  const json = JSON.stringify(params);
  const signature = crypto
    .createHmac('sha1', secret)
    .update(json)
    .digest('hex');

  return { params: json, signature };
}

export async function uploadToTransloadit(
  fileBuffer: Buffer,
  fileName: string,
  fileType: 'image' | 'video'
): Promise<string> {
  const key = process.env.TRANSLOADIT_KEY!;
  const secret = process.env.TRANSLOADIT_SECRET!;

  if (!key || !secret) {
    throw new Error('Missing TRANSLOADIT_KEY or TRANSLOADIT_SECRET');
  }

  // ✅ Correct assembly config
  const assemblyParams = {
    auth: {
      key,
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    steps: {
      ":original": {
        robot: '/upload/handle',
        result: true,
      },
    },
  };

  const { params, signature } = signParams(assemblyParams, secret);

  const formData = new FormData();
  formData.append('params', params);
  formData.append('signature', signature);

  // Node.js Buffer → Blob fix
  const mime =
    fileType === 'image' ? 'image/jpeg' : 'video/mp4';

  const blob = new Blob([new Uint8Array(fileBuffer)], {
    type: mime,
  });

  // Field name MUST match step name: upload
  formData.append('upload', blob, fileName);

  const res = await fetch('https://api2.transloadit.com/assemblies', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok || data.error) {
    console.error('Transloadit error:', data);
    throw new Error(
      data.error || data.message || 'Transloadit upload failed'
    );
  }

const file = data.results?.[":original"]?.[0];
  if (!file?.ssl_url) {
    console.error('No file URL returned:', data);
    throw new Error('Upload succeeded but no file URL returned');
  }

  return file.ssl_url;
}