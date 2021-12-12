import puppeteer from 'puppeteer'
import fs from 'fs'
import _ from 'lodash'

console.log('Starting all the bullshit')

const guides: any[] = []

function getElementProperty(page: puppeteer.Page, sel: string, property: string) {
  return page.evaluate((sel, property) => {
    const element = document.querySelector(sel)
    if (element) {
      return element[property]
    }

    return '';
  }, sel, property)
}


const parseGuide = async (browser: puppeteer.Browser, url: string) => {
  try {
    const page = await browser.newPage()

    await page.goto(url, {
      waitUntil: 'networkidle2',
    })

    // const name = await page.$eval('.nt-gid-linfo-zag a', node => node.textContent)
    const name = await getElementProperty(page, '.nt-gid-linfo-zag a', 'textContent')

    // const specialty = await page.$eval('.nt-gid-linfo-who', node => node.textContent)
    const specialty = await getElementProperty(page, '.nt-gid-linfo-who', 'textContent')

    // const city = await page.$eval('.nt-gid-linfo-city', node => node.nodeValue)
    // const city = await getElementProperty(page, '.nt-gid-linfo-city', 'nodeValue')

    // const phone = await page.$eval('.nt-gid-linfo-tel', node => node.textContent)
    const phone = await getElementProperty(page, '.nt-gid-linfo-tel', 'textContent')
    // const email = await page.$eval('.nt-gid-linfo-email a', node => node.textContent)
    const email = await getElementProperty(page, '.nt-gid-linfo-email a', 'textContent')

    const data = {
      name,
      specialty,
      // city,
      phone: phone?.replace(new RegExp('\t', 'g'), ''),
      email,
    }

    const stringified = `${specialty} ${name} ${phone} ${email}`

    console.log('Found guide', stringified)

    guides.push(data)
  } catch (e) {
    console.error('Cannot handle guide', e)
  }
}


const runShit = async () => {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Going to browser')
  await page.goto('https://experts-tourister.ru/russia/guides?f=1', {
    waitUntil: 'networkidle2',
  });
  const urlElements = await page.$$('.guid-list__item-body h3')

  const links = await Promise.all(urlElements.map(async (el) => {
    const link = await el.$eval('a', node => node.getAttribute('href'))


    return link
  }))

  const goodLinks = links.filter(Boolean) as string[]

  const chunks = _.chunk(goodLinks, 10)

  console.log(`Got ${links.length} links, good links: ${goodLinks.length} items`)

  for (let chunk of chunks) {
    await Promise.all(chunk.map((link) => parseGuide(browser, link)))
  }

  console.log('Closing, now writing to file')

  fs.writeFileSync('guides.json', JSON.stringify(guides, null, 2))

  console.log('Done')

  await browser.close();
}

runShit()
