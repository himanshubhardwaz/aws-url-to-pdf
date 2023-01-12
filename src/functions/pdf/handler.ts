import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import schema from "./schema";

const chromium = require("chrome-aws-lambda");

async function getPdf(url: string) {
  if (!url || typeof url !== "string") {
    return new Error("Invalid URL: " + url);
  }

  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    console.log("---- Browser created ----");

    const page = await browser.newPage();

    console.log("---- Page created ----");

    await page.goto(url, {
      waitUntil: ["load", "domcontentloaded", "networkidle0", "networkidle2"],
    });

    console.log("---- Went to target URL ----");

    const pdf = await page.pdf({ format: "A4" });

    console.log("---- Pdf created ----");

    return pdf;
  } catch (error) {
    console.log(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

const pdf: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const url = event.body.url;
  const convertedPdf = await getPdf(url);
  if (convertedPdf)
    return {
      headers: {
        "Content-Type": "application/pdf",
      },
      statusCode: 200,
      body: convertedPdf.toString("base64"),
      isBase64Encoded: true,
    };

  return {
    statusCode: 400,
    error: "Something went wrong!!",
    body: null,
  };
};

export const main = middyfy(pdf);
