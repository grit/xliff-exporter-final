// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Import

var he = require("he")

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Definition

export enum DocSearchResultDataType {
  contentBlock = "contentBlock",
  sectionHeader = "sectionHeader",
  pageTitle = "pageTitle",
  groupTitle = "groupTitle",
}

export type DocSearchResultData = {
  pageName: string
  text: string
  category: string
  type: DocSearchResultDataType
  url: string
}

// --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
// MARK: - Search index processing

export function buildXLiffOutput(pages: Array<DocumentationPage>, groups: Array<DocumentationGroup>): string {
  // Construct XLiff definition file
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file source-language="en" target-language="jp" datatype="plaintext" original="supernova-documentation.data">
      <header>
        <tool tool-id="supernova.io" tool-name="supernova"/>
      </header>
      <body>
        ${buildXLiffBody(pages, groups)}
      </body>
    </file>
  </xliff>
`
}

function buildXLiffBody(pages: Array<DocumentationPage>, groups: Array<DocumentationGroup>): string {
  let units: Array<string> = []
  for (let page of pages) {
    const blocks = flattenedBlocksOfPage(page)
    const applicableBlocks = blocks.filter((b) => b.type === "Text" || b.type === "Heading" || b.type === "Callout" || b.type === "Quote")
    units = units.concat(applicableBlocks.map((b) => representBlockAsXLiff(b, page)))
  }

  return units.join("\n")
}

function representBlockAsXLiff(block: DocumentationPageBlock, page: DocumentationPage): string {
  const text = textBlockPlainText(block as DocumentationPageBlockText)
  const encodedText = he.escape(text)

  return `  
    <trans-unit id="${block.id}">
      <source>${encodedText}</source>
      <target>${encodedText}</target>
      <context-group purpose="location">
        <context context-type="blocktype">${block.type}</context>
        <context context-type="pageid">${page.persistentId}</context>
      </context-group>
    </trans-unit>
  `
}

function flattenedBlocksOfPage(page: DocumentationPage): Array<DocumentationPageBlock> {
  let blocks: Array<DocumentationPageBlock> = page.blocks
  for (let block of page.blocks) {
    blocks = blocks.concat(flattenedBlocksOfBlock(block))
  }

  return blocks
}

function flattenedBlocksOfBlock(block: DocumentationPageBlock): Array<DocumentationPageBlock> {
  let subblocks: Array<DocumentationPageBlock> = block.children
  for (let subblock of block.children) {
    subblocks = subblocks.concat(flattenedBlocksOfBlock(subblock))
  }
  return subblocks
}

function textBlockPlainText(header: DocumentationPageBlockText): string {
  return header.text.spans.map((s) => s.text).join("")
}
