type NumberTransformParams = string | number;

/**
 * number formatting
 * Support string conversion to numbers, and fix the problem of missing floating point precision
 * @param data
 * @param length
 */
export function numberFixed(data: NumberTransformParams, length = 2): number {
  // If it is a string, you need to filter out the thousandth comma
  const num = Number(typeof data === "string" ? data.replace(/,/g, "") : data);
  let times = 1;
  for (let i = 0; i < length; i++) {
    times *= 10;
  }
  return Math.round(num * times) / times;
}

/**
 * Zero padding, negative numbers are not supported (negative numbers will be automatically converted to positive numbers)
 */
export function zeroFill(number: NumberTransformParams, length = 2): string {
  const numArr = number.toString().split(".");
  let decimal = numArr[1] || "";
  // When the length is insufficient, it will be automatically filled with 0
  while (decimal.length < length) {
    decimal += "0";
  }
  return `${numArr[0]}.${decimal}`;
}

export const stringNumToNumber = (str: string, length?: number): number =>
  numberFixed(str.replace(/[^0-9.]/g, ""), length);
