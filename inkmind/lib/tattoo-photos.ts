/**
 * Pool of tattoo photos from public/Tatto Photos.
 * Add new filenames here when you add images to the folder.
 */
const TATTOO_PHOTOS_POOL = [
  "/Tatto Photos/Messenger_creation_6923AAC7-0E0F-4B60-988D-821D8F6E1897.jpeg",
  "/Tatto Photos/Messenger_creation_736A80F2-425A-4EFD-A455-6DD9E22E4CE6.jpeg",
  "/Tatto Photos/Messenger_creation_740784B5-59BE-43B5-A92A-18B0F11D5F21.jpeg",
  "/Tatto Photos/Messenger_creation_7A1D3AB5-2161-4032-9108-CA9D0E7032E4.jpeg",
  "/Tatto Photos/Messenger_creation_8844CDE1-B2F3-4984-A868-9D3BBC285E2F.jpeg",
  "/Tatto Photos/Messenger_creation_98166F86-9B2C-4993-900A-A5CF4FA1A488.jpeg",
  "/Tatto Photos/Messenger_creation_A6B1BAF7-D545-4C22-929C-5E62003E55CC.jpeg",
  "/Tatto Photos/updated tatto1.JPG",
  "/Tatto Photos/updated tatto2.JPG",
  "/Tatto Photos/updated tatto3.JPG",
  "/Tatto Photos/updated tatto4.JPG",
  "/Tatto Photos/updated tatto5.JPG",
  "/Tatto Photos/updated tatto6.JPG",
  "/Tatto Photos/updated tatto7.JPG",
  "/Tatto Photos/updated tatto8.JPG",
  "/Tatto Photos/updated tatto9.JPG",
  "/Tatto Photos/updated tatto10.JPG",
  "/Tatto Photos/updated tatto11.JPG",
  "/Tatto Photos/updated tatto12.JPG",
  "/Tatto Photos/updated tatto13.JPG",
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Returns n random tattoo photos from the pool. Guarantees all unique — no duplicate tattoos. */
export function getRandomTattooPhotos(n: number): string[] {
  const uniquePool = [...new Set(TATTOO_PHOTOS_POOL)];
  if (uniquePool.length < n) {
    return uniquePool;
  }
  const shuffled = shuffle(uniquePool);
  return shuffled.slice(0, n);
}

export { TATTOO_PHOTOS_POOL };
