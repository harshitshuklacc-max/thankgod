import JsBarcode from "jsbarcode";

export type BarcodeType = "code128" | "ean13" | "qrcode";

export function generateBarcodeSVG(
  value: string,
  type: BarcodeType = "code128"
): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  if (type === "qrcode") {
    // QR codes use bwip-js on server; client fallback to code128
    JsBarcode(svg, value, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    });
  } else {
    JsBarcode(svg, value, {
      format: type === "ean13" ? "EAN13" : "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 14,
      margin: 10,
    });
  }

  return new XMLSerializer().serializeToString(svg);
}

export function barcodeToDataURL(
  value: string,
  type: BarcodeType = "code128"
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, value, {
        format: type === "ean13" ? "EAN13" : "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
      resolve(canvas.toDataURL("image/png"));
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateBarcodeServer(
  value: string,
  type: BarcodeType = "code128"
): Promise<Buffer> {
  const bwipjs = await import("bwip-js");

  const bcid = type === "ean13" ? "ean13" : type === "qrcode" ? "qrcode" : "code128";

  const png = await bwipjs.default.toBuffer({
    bcid,
    text: value,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });

  return png;
}
