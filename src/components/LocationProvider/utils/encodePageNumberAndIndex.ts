export function encodePageNumberAndIndex(pageNumber: number, index: number) {
  const asHexByte = (num: number) => (num & 0xff).toString(16).padStart(2, "0");
  return `${asHexByte(pageNumber)}${asHexByte(index)}${asHexByte(index >> 8)}`;
}
