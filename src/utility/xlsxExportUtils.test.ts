import { injectFreezePaneXml } from './xlsxExportUtils';

describe('injectFreezePaneXml', () => {
  const freeze = {
    xSplit: 1,
    ySplit: 1,
    topLeftCell: 'B2',
    activePane: 'bottomRight' as const,
  };

  it('adds pane and selection to a self-closing sheetView', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0" /></sheetViews>' +
      '<sheetData />' +
      '</worksheet>';

    const patchedXml = injectFreezePaneXml(xml, freeze);

    expect(patchedXml).toContain('<pane');
    expect(patchedXml).toContain('xSplit="1"');
    expect(patchedXml).toContain('topLeftCell="B2"');
    expect(patchedXml).toContain('<selection');
    expect(patchedXml).toContain('pane="bottomRight"');
  });

  it('replaces existing pane and selection nodes instead of duplicating them', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0">' +
      '<pane xSplit="2" ySplit="2" topLeftCell="C3" activePane="bottomRight" state="frozen" />' +
      '<selection pane="bottomRight" activeCell="C3" sqref="C3" />' +
      '</sheetView></sheetViews>' +
      '<sheetData />' +
      '</worksheet>';

    const patchedXml = injectFreezePaneXml(xml, freeze);

    expect(patchedXml.match(/<pane\b/g)).toHaveLength(1);
    expect(patchedXml.match(/<selection\b/g)).toHaveLength(1);
    expect(patchedXml).toContain('topLeftCell="B2"');
    expect(patchedXml).toContain('activeCell="B2"');
  });
});
