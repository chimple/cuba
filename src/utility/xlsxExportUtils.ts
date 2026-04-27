export type FreezePaneConfig = {
  xSplit: number;
  ySplit: number;
  topLeftCell: string;
  activePane: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  activeCell?: string;
  sqref?: string;
};

type JsZipWorksheetFile = {
  async: (type: 'string') => Promise<string>;
};

type JsZipWorkbook = {
  file: {
    (path: string): JsZipWorksheetFile | null;
    (path: string, data: string): unknown;
  };
  generateAsync: (options: { type: 'arraybuffer' }) => Promise<ArrayBuffer>;
};

type JsZipStatic = {
  loadAsync: (input: ArrayBuffer) => Promise<JsZipWorkbook>;
};

export const XLSX_EXPORT_BORDER_COLOR = 'D0D7DE';
export const XLSX_EXPORT_FONT_NAME = 'Inter';
export const XLSX_EXPORT_FONT_SIZE = 10;

const createXmlElement = (
  doc: XMLDocument,
  namespaceUri: string | null,
  name: string,
) =>
  namespaceUri
    ? doc.createElementNS(namespaceUri, name)
    : doc.createElement(name);

export const injectFreezePaneXml = (
  xml: string,
  freeze: FreezePaneConfig,
): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    return xml;
  }

  const worksheet = doc.documentElement;
  const namespaceUri = worksheet.namespaceURI;

  let sheetViews = worksheet.getElementsByTagName('sheetViews')[0];
  if (!sheetViews) {
    sheetViews = createXmlElement(doc, namespaceUri, 'sheetViews');
    const firstElementChild = Array.from(worksheet.childNodes).find(
      (node) => node.nodeType === Node.ELEMENT_NODE,
    );
    worksheet.insertBefore(sheetViews, firstElementChild ?? null);
  }

  let sheetView = sheetViews.getElementsByTagName('sheetView')[0];
  if (!sheetView) {
    sheetView = createXmlElement(doc, namespaceUri, 'sheetView');
    sheetView.setAttribute('workbookViewId', '0');
    sheetViews.appendChild(sheetView);
  }

  Array.from(sheetView.getElementsByTagName('pane')).forEach((pane) => {
    if (pane.parentNode === sheetView) {
      sheetView.removeChild(pane);
    }
  });
  Array.from(sheetView.getElementsByTagName('selection')).forEach(
    (selection) => {
      if (selection.parentNode === sheetView) {
        sheetView.removeChild(selection);
      }
    },
  );

  const pane = createXmlElement(doc, namespaceUri, 'pane');
  pane.setAttribute('xSplit', String(freeze.xSplit));
  pane.setAttribute('ySplit', String(freeze.ySplit));
  pane.setAttribute('topLeftCell', freeze.topLeftCell);
  pane.setAttribute('activePane', freeze.activePane);
  pane.setAttribute('state', 'frozen');
  sheetView.appendChild(pane);

  const selection = createXmlElement(doc, namespaceUri, 'selection');
  selection.setAttribute('pane', freeze.activePane);
  selection.setAttribute('activeCell', freeze.activeCell ?? freeze.topLeftCell);
  selection.setAttribute('sqref', freeze.sqref ?? freeze.topLeftCell);
  sheetView.appendChild(selection);

  return new XMLSerializer().serializeToString(doc);
};

export const applyFreezePanesToWorkbook = async (
  fileBuffer: ArrayBuffer,
  sheetNames: string[],
  sheetFreeze?: Record<string, FreezePaneConfig>,
) => {
  const freezeEntries = Object.entries(sheetFreeze ?? {});
  if (freezeEntries.length === 0) return fileBuffer;

  const JSZip = (await import('jszip')).default as JsZipStatic;
  const zip = await JSZip.loadAsync(fileBuffer);

  for (const [sheetName, freeze] of freezeEntries) {
    const sheetIndex = sheetNames.indexOf(sheetName);
    if (sheetIndex < 0) continue;

    const worksheetPath = `xl/worksheets/sheet${sheetIndex + 1}.xml`;
    const worksheetFile = zip.file(worksheetPath);
    if (!worksheetFile) continue;

    const worksheetXml = await worksheetFile.async('string');
    zip.file(worksheetPath, injectFreezePaneXml(worksheetXml, freeze));
  }

  return zip.generateAsync({ type: 'arraybuffer' });
};
