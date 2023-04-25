import fs from "fs"
import path from "path"
import utils from "util"
import puppeteer from "puppeteer"
import hb from "handlebars"

const readFile = utils.promisify(fs.readFile)

async function getTemplateHtml() {
  try {
    const resumePath = path.resolve("./templates/resume.hbs")
    return await readFile(resumePath, "utf8")
  } catch (err) {
    console.log(err)
    return Promise.reject("Could not load html template")
  }
}

export async function generateResumePdf(userInfoMap) {
  try {
    const res = await getTemplateHtml()
    const template = hb.compile(res, { strict: true })
    const html = template(userInfoMap)

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.setContent(html)

    const pdf = await page.pdf({ format: "A4" })
    await browser.close()

    return pdf
  } catch (err) {
    console.log("Pdf generation error: ", err)
    throw err
  }
}
