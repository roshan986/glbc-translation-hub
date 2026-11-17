// ================================================================
//  AUTHORIZE IMPORT FEATURE (run this once before using Import)
// ================================================================

/**
 * Run this ONCE from the Apps Script editor (or via the menu) to grant
 * Drive and Document access permissions needed by the Import feature.
 * After running, the "Import Drafter Doc" menu item will work correctly.
 */
function authorizeImportFeature() {
  // Touch DriveApp and DocumentApp to trigger the OAuth consent screen
  var root = DriveApp.getRootFolder();
  var tempDoc = DocumentApp.create('_glbc_auth_temp');
  tempDoc.saveAndClose();
  try {
    DriveApp.getFileById(tempDoc.getId()).setTrashed(true);
  } catch(e) { /* ignore */ }

  try {
    SpreadsheetApp.getUi().alert(
      '✅ Authorization Complete!\n\n'
      + 'Drive and Document access have been granted.\n'
      + 'You can now use "📥 Import Drafter Doc" and "📄 Download Drafter Template" from the menu.'
    );
  } catch (uiErr) {
    Logger.log('✅ Authorization Complete! Drive and Document access have been granted.');
  }
}

// ================================================================
//  DRAFTER DOC IMPORT
// ================================================================

/**
 * Entry point: Shows a dialog for the admin to pick a Drive folder,
 * then lists Google Docs in that folder for import.
 */
function showImportDrafterDocUi() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  if (!isBookSheet(sheet.getName())) {
    ui.alert("⚠️ Please switch to a translation book tab (e.g. Romans) first.");
    return;
  }

  var props = PropertiesService.getUserProperties();
  var savedFolderId = props.getProperty('IMPORT_FOLDER_ID') || '';

  var html = HtmlService.createHtmlOutput(buildFolderBrowserHtml(savedFolderId))
    .setWidth(520)
    .setHeight(460);
  ui.showModalDialog(html, '📥 Import Drafter Doc');
}

/**
 * Extracts a folder ID from either a raw ID string or a full Google Drive URL.
 */
function extractFolderId(input) {
  if (!input) return "";
  var str = String(input).trim();
  var match = str.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  var idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return str;
}

/**
 * Called from the HTML dialog when user confirms a folder ID or URL.
 * Saves the folder ID, then lists Google Docs in the folder.
 */
function confirmImportFolder(rawInput) {
  var folderId = extractFolderId(rawInput);
  if (!folderId) {
    return { error: 'Please enter a valid Google Drive Folder ID or URL.' };
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    return { error: 'Could not access folder (' + folderId + '). Please check that the ID is correct and shared with your Google account.' };
  }

  try {
    PropertiesService.getUserProperties().setProperty('IMPORT_FOLDER_ID', folderId);
  } catch (e) { /* ignore properties failure */ }

  var files = folder.getFilesByType(MimeType.GOOGLE_DOCS);
  var docList = [];
  while (files.hasNext()) {
    var f = files.next();
    docList.push({ id: f.getId(), name: f.getName() });
  }

  if (docList.length === 0) {
    // Check if there are .docx / .doc files
    var allFiles = folder.getFiles();
    var docxFiles = [];
    while (allFiles.hasNext()) {
      var fl = allFiles.next();
      var fn = fl.getName();
      if (fn.toLowerCase().indexOf('.docx') > -1 || fn.toLowerCase().indexOf('.doc') > -1) {
        docxFiles.push(fl);
        // Also check if a converted Google Doc with this base name exists in Drive
        var baseName = fn.replace(/\.docx?$/i, '').trim();
        var candFiles = DriveApp.getFilesByName(baseName);
        while (candFiles.hasNext()) {
          var cand = candFiles.next();
          if (cand.getMimeType() === MimeType.GOOGLE_DOCS) {
            docList.push({ id: cand.getId(), name: cand.getName() });
          }
        }
      }
    }

    if (docList.length > 0) {
      return { docs: docList };
    }

    if (docxFiles.length > 0) {
      var names = docxFiles.map(function(f) { return f.getName(); });
      return {
        error: 'Found Word document: ' + names.join(', ') + '.\n\nGoogle Docs opens Word files in "Compatibility Mode" (you will see a blue [.DOCX] tag at the top).\n\nTo complete the conversion:\n1. Open the file in Google Docs\n2. In the top menu, click: File → Save as Google Docs\n3. Come back and click Next ▶ again!'
      };
    }
    return { error: 'No documents found in this folder. Upload the file to Google Drive and open it as a Google Doc.' };
  }

  return { docs: docList };
}

/**
 * Called from HTML dialog: parses a Google Doc and returns verse preview data.
 */
function previewDocVerses(docId) {
  var sheet = SpreadsheetApp.getActiveSheet();

  var doc;
  try {
    doc = DocumentApp.openById(docId);
  } catch (e) {
    return { error: 'Cannot open document. Ensure it is shared with the script owner.' };
  }

  var body = doc.getBody();
  var verses = parseVerseBlocks(body);

  if (verses.length === 0) {
    return { error: 'No verse blocks found. Ensure the doc uses labels: "Old Reading (KJV):", "Proposed Reading:", "Drafter Comments:".' };
  }

  var lastRow = sheet.getLastRow();
  var numDataRows = lastRow - DATA_START_ROW + 1;
  var sheetData = numDataRows > 0
    ? sheet.getRange(DATA_START_ROW, COL.VERSE, numDataRows, COL.DRAFTER_CMT).getValues()
    : [];

  var preview = verses.map(function (v) {
    var rowInfo = { found: false, row: -1, hasConflict: false };
    for (var i = 0; i < sheetData.length; i++) {
      var cellVerse = String(sheetData[i][0]).trim();
      if (normalizeVerseRef(cellVerse) === normalizeVerseRef(v.ref)) {
        rowInfo.found = true;
        rowInfo.row = DATA_START_ROW + i;
        var hasOld      = String(sheetData[i][COL.OLD_READING  - COL.VERSE]).trim() !== '';
        var hasProposed = String(sheetData[i][COL.PROPOSED     - COL.VERSE]).trim() !== '';
        var hasCmt      = String(sheetData[i][COL.DRAFTER_CMT  - COL.VERSE]).trim() !== '';
        rowInfo.hasConflict = hasOld || hasProposed || hasCmt;
        break;
      }
    }
    return {
      ref:          v.ref,
      found:        rowInfo.found,
      row:          rowInfo.row,
      hasConflict:  rowInfo.hasConflict
    };
  });

  return { preview: preview, docId: docId };
}

/**
 * Performs the actual import for the selected verses.
 * selectedRefs  : array of verse ref strings to import
 * overwriteRefs : array of verse ref strings where user confirmed overwrite
 * docId         : Google Doc ID to import from
 */
function executeImport(selectedRefs, overwriteRefs, docId) {
  var sheet = SpreadsheetApp.getActiveSheet();

  var doc;
  try {
    doc = DocumentApp.openById(docId);
  } catch (e) {
    return { error: 'Cannot open document.' };
  }

  var body   = doc.getBody();
  var verses = parseVerseBlocks(body);

  var lastRow = sheet.getLastRow();
  var numDataRows = lastRow - DATA_START_ROW + 1;
  var sheetVerseCol = numDataRows > 0
    ? sheet.getRange(DATA_START_ROW, COL.VERSE, numDataRows, 1).getValues()
    : [];

  var imported = 0;
  var skipped  = 0;

  for (var vi = 0; vi < verses.length; vi++) {
    var v = verses[vi];
    if (selectedRefs.indexOf(v.ref) === -1) continue;

    // Find matching sheet row
    var targetRow = -1;
    for (var i = 0; i < sheetVerseCol.length; i++) {
      if (normalizeVerseRef(String(sheetVerseCol[i][0]).trim()) === normalizeVerseRef(v.ref)) {
        targetRow = DATA_START_ROW + i;
        break;
      }
    }
    if (targetRow === -1) { skipped++; continue; }

    // Check for existing data conflict
    var oldVal  = sheet.getRange(targetRow, COL.OLD_READING).getValue();
    var propVal = sheet.getRange(targetRow, COL.PROPOSED).getValue();
    var cmtVal  = sheet.getRange(targetRow, COL.DRAFTER_CMT).getValue();
    var hasExisting = (String(oldVal).trim() !== '' || String(propVal).trim() !== '' || String(cmtVal).trim() !== '');

    if (hasExisting && overwriteRefs.indexOf(v.ref) === -1) {
      skipped++;
      continue;
    }

    writeRichTextToCell(sheet, targetRow, COL.OLD_READING, v.oldReading);
    writeRichTextToCell(sheet, targetRow, COL.PROPOSED,    v.proposed);
    writeRichTextToCell(sheet, targetRow, COL.DRAFTER_CMT, v.drafterCmt);
    imported++;
  }

  // Delete the Google Doc from Drive after import
  try {
    DriveApp.getFileById(docId).setTrashed(true);
  } catch (e) { /* non-critical */ }

  return { imported: imported, skipped: skipped };
}

// ----------------------------------------------------------------
//  PARSING HELPERS
// ----------------------------------------------------------------

/**
 * Normalises a verse reference to "chapter:verse" for comparison.
 * Handles "Rom 1:1", "Romans 1:1", "1:1", "1" etc.
 */
function normalizeVerseRef(ref) {
  var match = ref.match(/(\d+):(\d+)/);
  if (match) return match[1] + ':' + match[2];
  return ref.toLowerCase().trim();
}

/**
 * Parses a Google Doc body and returns an array of verse block objects.
 * Each: { ref, oldReading:{text,runs}, proposed:{text,runs}, drafterCmt:{text,runs} }
 */
function parseVerseBlocks(body) {
  var numChildren = body.getNumChildren();
  var verses      = [];
  var currentVerse   = null;
  var currentSection = null; // 'old' | 'proposed' | 'cmt'

  var OLD_LABEL      = 'old reading (kjv):';
  var PROPOSED_LABEL = 'proposed reading:';
  var CMT_LABEL      = 'drafter comments:';

  for (var i = 0; i < numChildren; i++) {
    var child     = body.getChild(i);
    var childType = child.getType();

    if (childType === DocumentApp.ElementType.PARAGRAPH) {
      var para          = child.asParagraph();
      var paraText      = para.getText().trim();
      var paraTextLower = paraText.toLowerCase();

      // Detect English verse reference line e.g. "Rom 2:7", "Romans 1:1"
      if (/^[a-zA-Z]+\s*\d+:\d+/.test(paraText) || /^\d+:\d+/.test(paraText)) {
        if (currentVerse) verses.push(currentVerse);
        currentVerse = {
          ref:        paraText.trim(),
          oldReading: { text: '', runs: [] },
          proposed:   { text: '', runs: [] },
          drafterCmt: { text: '', runs: [] }
        };
        currentSection = null;
        continue;
      }

      if (!currentVerse) continue;

      // Detect section labels
      if (paraTextLower.indexOf(OLD_LABEL) === 0) {
        currentSection = 'old';
        appendRichFromPara(para, currentVerse.oldReading, OLD_LABEL.length);
        continue;
      }
      if (paraTextLower.indexOf(PROPOSED_LABEL) === 0) {
        currentSection = 'proposed';
        appendRichFromPara(para, currentVerse.proposed, PROPOSED_LABEL.length);
        continue;
      }
      if (paraTextLower.indexOf(CMT_LABEL) === 0) {
        currentSection = 'cmt';
        appendRichFromPara(para, currentVerse.drafterCmt, CMT_LABEL.length);
        continue;
      }

      // Regular paragraph under current section
      if (currentSection) {
        var target = getSectionTarget(currentVerse, currentSection);
        if (target.text.length > 0) {
          target.text += '\n';
          target.runs.push({ text: '\n', color: null });
        }
        appendRichFromPara(para, target, 0);
      }

    } else if (childType === DocumentApp.ElementType.TABLE) {
      if (!currentVerse || !currentSection) continue;
      var table  = child.asTable();
      var target = getSectionTarget(currentVerse, currentSection);
      var numRows = table.getNumRows();

      for (var r = 0; r < numRows; r++) {
        var tableRow = table.getRow(r);
        var numCells = tableRow.getNumCells();
        if (target.text.length > 0) {
          target.text += '\n';
          target.runs.push({ text: '\n', color: null, bold: false, italic: false });
        }
        for (var c = 0; c < numCells; c++) {
          if (c > 0) {
            target.text += ' | ';
            target.runs.push({ text: ' | ', color: null, bold: false, italic: false });
          }
          var cell = tableRow.getCell(c);
          var cellChildren = cell.getNumChildren();
          for (var cp = 0; cp < cellChildren; cp++) {
            var cChild = cell.getChild(cp);
            if (cChild.getType() === DocumentApp.ElementType.PARAGRAPH) {
              appendRichFromPara(cChild.asParagraph(), target, 0);
            }
          }
        }
      }
    }
  }

  if (currentVerse) verses.push(currentVerse);
  return verses;
}

function getSectionTarget(verse, section) {
  if (section === 'old')      return verse.oldReading;
  if (section === 'proposed') return verse.proposed;
  return verse.drafterCmt;
}

/**
 * Appends rich-text runs from a paragraph to a section object.
 * startCharOffset: number of leading characters to skip (e.g. length of label).
 */
function appendRichFromPara(para, section, startCharOffset) {
  var numElements = para.getNumChildren();
  if (numElements === 0) {
    try {
      var txt = para.editAsText();
      if (txt) appendRichFromTextElement(txt, section, startCharOffset);
    } catch (e) {}
    return;
  }

  var charsSeen = 0;
  for (var e = 0; e < numElements; e++) {
    var el = para.getChild(e);
    if (el.getType() === DocumentApp.ElementType.TEXT) {
      var textEl = el.asText();
      var fullText = textEl.getText();
      if (!fullText) continue;

      var elStart = charsSeen;
      var elEnd = charsSeen + fullText.length;
      charsSeen += fullText.length;

      if (elEnd <= startCharOffset) continue;
      var localSkip = Math.max(0, startCharOffset - elStart);
      appendRichFromTextElement(textEl, section, localSkip);
    }
  }
}

/**
 * Extracts rich text runs with accurate colors, bold, and italic from a Text element.
 * Converts Google Docs highlight colors (background colors) into cell text colors with automatic bolding.
 */
function appendRichFromTextElement(textEl, section, startOffset) {
  var fullText = textEl.getText();
  if (!fullText) return;

  var indices = textEl.getTextAttributeIndices();
  if (!indices || indices.length === 0) indices = [0];

  for (var k = 0; k < indices.length; k++) {
    var segStart = indices[k];
    var segEnd = (k + 1 < indices.length) ? indices[k + 1] : fullText.length;

    if (segEnd <= startOffset) continue;
    var effectiveStart = Math.max(segStart, startOffset);
    var runText = fullText.substring(effectiveStart, segEnd);
    if (!runText) continue;

    var color = null;
    var isHighlighted = false;

    // Check for highlight color (character background color in Google Docs)
    try {
      var bg = textEl.getBackgroundColor(effectiveStart);
      if (bg && bg !== '#ffffff' && bg !== '#fff' && bg.toLowerCase() !== '#ffffff') {
        color = bg;
        isHighlighted = true;
      }
    } catch (bgErr) { color = null; }

    // If no highlight color, fall back to font foreground color
    if (!color) {
      try {
        var fg = textEl.getForegroundColor(effectiveStart);
        if (fg && fg !== '#000000' && fg !== '#000' && fg.toLowerCase() !== '#000000') {
          color = fg;
        }
      } catch (err) { color = null; }
    }

    var bold = false;
    try { bold = textEl.isBold(effectiveStart); } catch (e) {}
    // If text was highlighted in doc, automatically apply bold in sheet for visual emphasis
    if (isHighlighted) {
      bold = true;
    }

    var italic = false;
    try { italic = textEl.isItalic(effectiveStart); } catch (e) {}

    section.text += runText;
    section.runs.push({
      text: runText,
      color: color,
      bold: bold,
      italic: italic
    });
  }
}

/**
 * Writes a rich text section object into a Google Sheet cell.
 */
function writeRichTextToCell(sheet, row, col, section) {
  if (!section || !section.text) return;

  var rtv = SpreadsheetApp.newRichTextValue().setText(section.text);
  var pos = 0;

  for (var ri = 0; ri < section.runs.length; ri++) {
    var run = section.runs[ri];
    if (!run.text) continue;
    var start = pos;
    var end   = pos + run.text.length;

    var styleBuilder = SpreadsheetApp.newTextStyle();
    var hasStyle = false;

    if (run.color) {
      styleBuilder.setForegroundColor(run.color);
      hasStyle = true;
    }
    if (run.bold) {
      styleBuilder.setBold(true);
      hasStyle = true;
    }
    if (run.italic) {
      styleBuilder.setItalic(true);
      hasStyle = true;
    }

    if (hasStyle) {
      rtv.setTextStyle(start, end, styleBuilder.build());
    }
    pos = end;
  }

  sheet.getRange(row, col).setRichTextValue(rtv.build());
}

// ----------------------------------------------------------------
//  FOLDER BROWSER HTML
// ----------------------------------------------------------------

function buildFolderBrowserHtml(savedFolderId) {
  var savedNote = savedFolderId
    ? '<p class="info">Last used folder ID: <code>' + savedFolderId + '</code></p>'
    : '';

  return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<style>'
    + 'body{font-family:Arial,sans-serif;padding:16px;font-size:14px;margin:0;}'
    + 'h3{margin-top:0;color:#1a1a1a;}'
    + 'input,select{width:100%;padding:8px;box-sizing:border-box;margin:6px 0 10px;border:1px solid #ccc;border-radius:4px;font-size:13px;}'
    + '.btn{display:inline-block;padding:9px 18px;background:#1a73e8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;margin-top:6px;}'
    + '.btn:hover{background:#1557b0;}'
    + '.btn:disabled{background:#a0c3ff;cursor:not-allowed;}'
    + '.error{display:none;background:#fde8e8;color:#c5221f;border:1px solid #f5c2c7;padding:10px;border-radius:4px;font-size:13px;margin:10px 0;line-height:1.4;}'
    + '.info{color:#555;font-size:12px;}'
    + 'code{background:#f1f3f4;padding:2px 5px;border-radius:3px;font-size:11px;}'
    + '.verse-item{padding:5px 0;border-bottom:1px solid #eee;font-size:13px;}'
    + '.warn{color:#e67e22;}'
    + '.missing{color:#999;}'
    + '</style></head><body>'
    + '<h3>📥 Import Drafter Doc</h3>'
    + '<p class="info">Paste the <strong>Google Drive Folder ID</strong> (or full folder link) where the drafter uploaded their Word doc.<br>'
    + 'Find it in the folder URL after <code>/folders/</code>.</p>'
    + savedNote
    + '<input id="fid" type="text" placeholder="Paste folder ID or Drive URL here" value="' + savedFolderId + '" />'
    + '<div id="err" class="error"></div>'
    + '<button id="btnNext" class="btn" onclick="step1()">Next ▶</button>'
    + '<div id="content"></div>'
    + '</body>'
    + '<script>'
    + 'function step1(){'
    + '  var id=document.getElementById("fid").value.trim();'
    + '  if(!id){setErr("Please enter a Google Drive folder ID or folder link.");return;}'
    + '  setErr("");'
    + '  setBusy("⏳ Connecting to Google Drive and scanning folder...");'
    + '  var btn=document.getElementById("btnNext");'
    + '  if(btn){btn.disabled=true;btn.innerText="⏳ Checking Folder...";}'
    + '  google.script.run'
    + '    .withSuccessHandler(function(r){'
    + '      if(btn){btn.disabled=false;btn.innerText="Next ▶";}'
    + '      if(!r){setBusy("");setErr("No response received from Google Drive.");return;}'
    + '      if(r.error){setBusy("");setErr(r.error);return;}'
    + '      if(r.docs.length===1){loadPreview(r.docs[0].id);}'
    + '      else{showDocList(r.docs);}'
    + '    })'
    + '    .withFailureHandler(function(e){'
    + '      if(btn){btn.disabled=false;btn.innerText="Next ▶";}'
    + '      onErr(e);'
    + '    })'
    + '    .confirmImportFolder(id);'
    + '}'
    + 'function showDocList(docs){'
    + '  var h="<p class=info>Multiple docs found. Select one:</p><select id=docSel>";'
    + '  docs.forEach(function(d){h+="<option value=\'"+d.id+"\'>"+d.name+"</option>";});'
    + '  h+="</select><button class=btn onclick=\'loadPreview(document.getElementById(\\\"docSel\\\").value)\'>Load Verses ▶</button>";'
    + '  document.getElementById("content").innerHTML=h;'
    + '}'
    + 'function loadPreview(docId){'
    + '  setBusy("Parsing verses from document...");'
    + '  google.script.run.withSuccessHandler(showPreview).withFailureHandler(onErr).previewDocVerses(docId);'
    + '}'
    + 'function showPreview(r){'
    + '  setBusy("");'
    + '  if(r.error){setErr(r.error);return;}'
    + '  var docId=r.docId;'
    + '  var h="<h3 style=margin-top:16px>📋 Select Verses to Import</h3>";'
    + '  h+="<p class=info>✅ = row found in sheet &nbsp; ⚠️ = row already has data &nbsp; ❓ = verse not in sheet</p>";'
    + '  r.preview.forEach(function(v){'
    + '    var icon=!v.found?"<span class=missing>❓</span>":v.hasConflict?"<span class=warn>⚠️</span>":"✅";'
    + '    var dis=!v.found?"disabled":"";'
    + '    h+="<div class=verse-item><label><input type=checkbox class=vc value=\'"+v.ref+"\' data-conflict=\'"+(v.hasConflict?"1":"0")+"\' "+dis+"> "+icon+" "+v.ref+"</label></div>";'
    + '  });'
    + '  h+="<div id=err2 class=error></div>";'
    + '  h+="<br><button class=btn onclick=\'doImport(\\\""+docId+"\\\")\'>✅ Import Selected</button>";'
    + '  document.getElementById("content").innerHTML=h;'
    + '}'
    + 'function doImport(docId){'
    + '  var checks=document.querySelectorAll(".vc:checked");'
    + '  if(!checks.length){'
    + '    var e2=document.getElementById("err2");'
    + '    if(e2){e2.style.display="block";e2.innerText="Please select at least one verse.";}'
    + '    return;'
    + '  }'
    + '  var sel=[],ow=[];'
    + '  checks.forEach(function(c){'
    + '    sel.push(c.value);'
    + '    if(c.dataset.conflict==="1"){'
    + '      if(confirm("⚠️ "+c.value+" already has data. Overwrite?"))ow.push(c.value);'
    + '    }'
    + '  });'
    + '  document.getElementById("content").innerHTML="<p>⏳ Importing... please wait.</p>";'
    + '  google.script.run'
    + '    .withSuccessHandler(function(r){'
    + '      if(r.error){setErr(r.error);return;}'
    + '      document.body.innerHTML="<div style=padding:20px><h3>✅ Done!</h3><p>"+r.imported+" verse(s) imported. "+r.skipped+" skipped.</p><p class=info>The document has been deleted from Drive.</p><button class=btn onclick=google.script.host.close()>Close</button></div>";'
    + '    })'
    + '    .withFailureHandler(onErr)'
    + '    .executeImport(sel,ow,docId);'
    + '}'
    + 'function setBusy(msg){document.getElementById("content").innerHTML=msg?"<p class=info>"+msg+"</p>":"";}' 
    + 'function setErr(msg){'
    + '  var el=document.getElementById("err");'
    + '  if(!el)return;'
    + '  if(!msg){el.innerHTML="";el.style.display="none";return;}'
    + '  el.style.display="block";'
    + '  el.innerHTML=msg.replace(/\\n/g,"<br>");'
    + '}'
    + 'function onErr(e){'
    + '  var m=(e&&e.message)?e.message:String(e);'
    + '  if(m.indexOf("Authorization is required")>-1){'
    + '    setErr("⚠️ Authorization required! Please close this window, click \'📖 GLBC → 🔑 Authorize Import Feature (run once)\' in the menu to grant Google permissions, then try again.");'
    + '  } else {'
    + '    setErr("Error: "+m);'
    + '  }'
    + '  setBusy("");'
    + '}'
    + '</script></html>';
}

// ================================================================
//  DOWNLOAD DRAFTER TEMPLATE
// ================================================================

/**
 * Generates a Word-compatible Google Doc template for drafters,
 * opens the .docx export URL, then schedules auto-delete of the temp doc.
 */
function downloadDrafterTemplate() {
  // Create a temporary Google Doc
  var doc  = DocumentApp.create('GLBC Drafter Template (Temp)');
  var body = doc.getBody();
  body.clear();

  // Title
  body.appendParagraph('GLBC Drafter Document Template')
      .setHeading(DocumentApp.ParagraphHeading.TITLE);

  // Instructions
  body.appendParagraph('Instructions').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(
    'Structure your drafting document exactly as shown below so it can be imported into the Google Sheet automatically.\n\n'
    + 'RULES:\n'
    + '1. Start each verse block with the English reference on its own line (e.g. "Rom 1:1").\n'
    + '2. Under each verse, add these 3 labeled lines (labels must be exact, including the colon):\n'
    + '       Old Reading (KJV): <paste KJV text here>\n'
    + '       Drafter Comments: <paste back-translation table and notes here>\n'
    + '       Proposed Reading: <paste proposed reading here>\n'
    + '3. Apply text colors or text highlight colors — both font colors and highlights (e.g. yellow, green, cyan) are automatically preserved as bold colored text in the sheet.\n'
    + '4. Tables (2-row: Kannada on top, English below) inside Drafter Comments are supported.\n'
    + '5. Chapter headings, titles, and any other content between verse blocks are ignored.'
  ).setFontSize(11);

  body.appendParagraph(''); // spacer
  body.appendHorizontalRule();

  // Example: Romans 1:1
  body.appendParagraph('Example Verse Block').setHeading(DocumentApp.ParagraphHeading.HEADING1);

  body.appendParagraph('Rom 1:1').setBold(true).setFontSize(12);

  var oldPara = body.appendParagraph('');
  oldPara.appendText('Old Reading (KJV): ').setBold(true).setFontSize(11);
  oldPara.appendText('Paul, a servant of Jesus Christ, called to be an apostle...').setFontSize(11);

  var cmtPara = body.appendParagraph('');
  cmtPara.appendText('Drafter Comments: ').setBold(true).setFontSize(11);
  cmtPara.appendText('Back-translation and investigation notes:').setFontSize(11);

  // Sample back-translation table (Kannada top / English bottom)
  var tbl  = body.appendTable();
  var row0 = tbl.appendTableRow();
  row0.appendTableCell().setText('ಪೌಲನು (Paulanu)').setFontSize(10);
  row0.appendTableCell().setText('ಯೇಸು ಕ್ರಿಸ್ತನ (Yesu Kristana)').setFontSize(10);
  row0.appendTableCell().setText('ದಾಸನು (Dasanu)').setFontSize(10);
  var row1 = tbl.appendTableRow();
  row1.appendTableCell().setText('Paul').setFontSize(10);
  row1.appendTableCell().setText('of Jesus Christ').setFontSize(10);
  row1.appendTableCell().setText('a servant').setFontSize(10);

  // Colored note after table (still part of Drafter Comments)
  var notePara = body.appendParagraph('');
  notePara.appendText('Note: The word "servant" (ದಾಸನು) may need revision — the current form is too literal.')
          .setForegroundColor('#CC0000').setFontSize(11);

  var propPara = body.appendParagraph('');
  propPara.appendText('Proposed Reading: ').setBold(true).setFontSize(11);
  propPara.appendText('ಪೌಲನು, ಯೇಸು ಕ್ರಿಸ್ತನ ಸೇವಕನು...')
          .setForegroundColor('#0070C0').setFontSize(11);

  body.appendParagraph(''); // spacer
  body.appendHorizontalRule();

  // Example: Romans 1:2
  body.appendParagraph('Rom 1:2').setBold(true).setFontSize(12);

  var old2 = body.appendParagraph('');
  old2.appendText('Old Reading (KJV): ').setBold(true).setFontSize(11);
  old2.appendText('Which he had promised afore by his prophets in the holy scriptures...').setFontSize(11);

  var cmt2 = body.appendParagraph('');
  cmt2.appendText('Drafter Comments: ').setBold(true).setFontSize(11);
  cmt2.appendText('Add your back-translation table and investigation notes here.').setFontSize(11);

  var prop2 = body.appendParagraph('');
  prop2.appendText('Proposed Reading: ').setBold(true).setFontSize(11);
  prop2.appendText('ಅವನು ತನ್ನ ಪ್ರವಾದಿಗಳ ಮೂಲಕ ಮೊದಲೇ ವಾಗ್ದಾನ ಮಾಡಿದ...').setFontSize(11);

  doc.saveAndClose();

  var docId       = doc.getId();
  var downloadUrl = 'https://docs.google.com/document/d/' + docId + '/export?format=docx';

  // Schedule auto-delete of the temp doc after 60 seconds
  PropertiesService.getScriptProperties().setProperty('TEMP_TEMPLATE_DOC_ID', docId);
  ScriptApp.newTrigger('deleteTempTemplateDoc').timeBased().after(60000).create();

  // Open download URL in new tab via HTML dialog
  var html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial;padding:20px;">'
    + '<h3>📄 Template Ready!</h3>'
    + '<p>Your template download should start automatically.</p>'
    + '<p>If it does not, <a href="' + downloadUrl + '" target="_blank">click here to download</a>.</p>'
    + '<p style="font-size:12px;color:#555;">The temporary file will be auto-deleted from Drive in ~60 seconds.</p>'
    + '<button onclick="google.script.host.close()" '
    + 'style="padding:8px 16px;background:#1a73e8;color:#fff;border:none;border-radius:4px;cursor:pointer;">Close</button>'
    + '<script>window.open("' + downloadUrl + '","_blank");</script>'
    + '</body></html>'
  ).setWidth(380).setHeight(220);

  SpreadsheetApp.getUi().showModalDialog(html, '📄 Download Drafter Template');
}

/**
 * Time-triggered cleanup: deletes the temp template Google Doc from Drive.
 */
function deleteTempTemplateDoc() {
  var props = PropertiesService.getScriptProperties();
  var docId = props.getProperty('TEMP_TEMPLATE_DOC_ID');
  if (docId) {
    try { DriveApp.getFileById(docId).setTrashed(true); } catch (e) { /* ignore */ }
    props.deleteProperty('TEMP_TEMPLATE_DOC_ID');
  }
  // Self-clean the trigger
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'deleteTempTemplateDoc') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

