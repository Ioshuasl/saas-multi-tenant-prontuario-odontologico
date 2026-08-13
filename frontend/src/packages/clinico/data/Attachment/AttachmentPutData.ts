export async function AttachmentPutData(input: {
  uploadUrl: string;
  headers: Record<string, string>;
  file: File;
}): Promise<void> {
  const res = await fetch(input.uploadUrl, {
    method: 'PUT',
    headers: input.headers,
    body: input.file,
  });
  if (!res.ok) {
    throw new Error('Falha no upload do arquivo.');
  }
}
