// ================================================================
//  GOOGLE APPS SCRIPT WEB APP JSON API (HEADLESS SHEETS BRIDGE)
//  Version 1.0 - Decoupled React / PWA Backend Integration
// ================================================================

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getBooks";
  var callback = e && e.parameter && e.parameter.callback;
  var response;

  try {
    switch (action) {
      case "getBooks":
        response = apiGetBooks();
        break;
      case "getConfig":
        response = apiGetConfig();
        break;
      case "getVerses":
        var book = e.parameter.book || "Romans";
        var chapter = e.parameter.chapter || null;
        response = apiGetVerses(book, chapter);
        break;
      case "getAnalytics":
        var bookName = e.parameter.book || "Romans";
        response = apiGetAnalytics(bookName);
        break;
      case "getInitialBundle":
      case "init":
        var book = e.parameter.book || "Romans";
        var chapter = e.parameter.chapter || null;
        response = apiGetInitialBundle(book, chapter);
        break;
      case "syncProtections":
        response = apiSyncProtections();
        break;
      default:
        response = { success: false, error: "Unknown action: " + action };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return formatApiResponse(response, callback);
}

function doPost(e) {
  var response;
  try {
    var data;
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter;
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }

    var action = data.action || (e && e.parameter && e.parameter.action);

    switch (action) {
      case "submitReview":
        response = apiSubmitReview(data);
        break;
      case "submitFinal":
        response = apiSubmitFinal(data);
        break;
      case "importVerses":
        response = apiImportVerses(data);
        break;
      case "initBookSheet":
        response = apiInitBookSheet(data);
        break;
      case "saveMember":
        response = apiSaveMember(data);
        break;
      case "syncProtections":
        response = apiSyncProtections();
        break;
      default:
        response = { success: false, error: "Unknown POST action: " + action };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return formatApiResponse(response, null);
}

function formatApiResponse(data, callback) {
  var jsonString = JSON.stringify(data);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + jsonString + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

function apiGetBooks() {
  var sheets = getAllBookSheets();
  var books = sheets.map(function(s) { return s.getName(); });
  return { success: true, books: books };
}

function apiGetConfig() {
  var members = (typeof getAllConfigMembers === "function") ? getAllConfigMembers() : getAllActiveMembers();
  if (members.length === 0) {
    members = getAllActiveMembers();
  }
  return { success: true, team: members };
}

function apiGetInitialBundle(bookName, chapterFilter) {
  var bName = bookName || "Romans";
  var chFilter = chapterFilter || 1;
  var booksRes = apiGetBooks();
  var configRes = apiGetConfig();
  var versesRes = apiGetVerses(bName, chFilter);
  var analyticsRes = apiGetAnalytics(bName);
  return {
    success: true,
    books: booksRes.books || [bName],
    team: configRes.team || [],
    verses: versesRes.verses || [],
    analytics: analyticsRes.success ? analyticsRes : null
  };
}

function apiGetVerses(bookName, chapterFilter) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(bookName);
  if (!sheet) {
    return { success: false, error: "Book sheet not found: " + bookName };
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return { success: true, book: bookName, total: 0, verses: [] };
  }

  var numRows = lastRow - DATA_START_ROW + 1;
  var range = sheet.getRange(DATA_START_ROW, 1, numRows, 18);
  var values = range.getValues();
  var richValues = range.getRichTextValues();

  var verses = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var verseRef = String(r[COL.VERSE - 1] || "").trim();
    if (!verseRef) continue;

    // Optional chapter filtering (e.g. "Rom 1:1" -> chapter 1)
    if (chapterFilter) {
      var chapMatch = verseRef.match(/(\d+):/);
      if (chapMatch && chapMatch[1] !== String(chapterFilter)) {
        continue;
      }
    }

    var chapMatch = verseRef.match(/(\d+):(\d+)/);
    var chNum = chapMatch ? parseInt(chapMatch[1], 10) : (chapterFilter ? Number(chapterFilter) : 1);
    var vNum = chapMatch ? parseInt(chapMatch[2], 10) : (i + 1);

    var proposedRich = richValues[i][COL.PROPOSED - 1];
    var drafterCmtRich = richValues[i][COL.DRAFTER_CMT - 1];

    var reviewsObj = {
      tech:       r[COL.TECH_REV - 1] || "",
      style:      r[COL.STYLE_REV - 1] || "",
      ortho:      r[COL.ORTHO_REV - 1] || "",
      theo:       r[COL.THEO_REV - 1] || "",
      conclusion: r[COL.CONCLUSION - 1] || "",
      final:      r[COL.FINAL - 1] || ""
    };

    verses.push({
      row: DATA_START_ROW + i,
      verse: verseRef,
      chapter: chNum,
      verseNumber: vNum,
      status: r[COL.STATUS - 1] || "Not Started",
      oldReading: r[COL.OLD_READING - 1] || "",
      proposed: r[COL.PROPOSED - 1] || "",
      proposedHtml: richTextToHtml(proposedRich),
      drafterCmt: r[COL.DRAFTER_CMT - 1] || "",
      drafterCmtHtml: richTextToHtml(drafterCmtRich),
      confirms: {
        drafter: r[COL.DRAFTER_CONFIRM - 1] === "Y",
        tech:    r[COL.TECH_CONFIRM - 1] === "Y",
        style:   r[COL.STYLE_CONFIRM - 1] === "Y",
        ortho:   r[COL.ORTHO_CONFIRM - 1] === "Y",
        theo:    r[COL.THEO_CONFIRM - 1] === "Y",
        comm:    r[COL.COMM_CONFIRM - 1] === "Y",
        final:   r[COL.FINAL_CONFIRM - 1] === "Y"
      },
      reviews: reviewsObj,
      comments: parseReviewsToComments(reviewsObj, verseRef)
    });
  }

  return {
    success: true,
    book: bookName,
    chapter: chapterFilter ? Number(chapterFilter) : null,
    total: verses.length,
    verses: verses
  };
}

function parseReviewsToComments(reviews, verseRef) {
  var list = [];
  var roles = [
    { key: "tech", label: "Technical Reviewer" },
    { key: "style", label: "Style & Language Reviewer" },
    { key: "ortho", label: "Orthographic Reviewer" },
    { key: "theo", label: "Theological Reviewer" },
    { key: "conclusion", label: "Committee" }
  ];

  for (var k = 0; k < roles.length; k++) {
    var item = roles[k];
    var val = reviews[item.key];
    if (!val || typeof val !== "string" || !val.trim()) continue;

    var blocks = val.indexOf("\n\n") !== -1 ? val.split(/\n\s*\n/) : val.split(/\n/);
    for (var b = 0; b < blocks.length; b++) {
      var blk = blocks[b].trim();
      if (!blk) continue;

      var match = blk.match(/^([A-Za-z0-9\s.]+?):\s*([\s\S]+)$/);
      if (match) {
        list.push({
          id: verseRef + "-" + item.key + "-" + b,
          authorName: match[1].trim(),
          authorRole: item.label,
          timeAgo: "Saved in Sheet",
          text: match[2].trim()
        });
      } else {
        list.push({
          id: verseRef + "-" + item.key + "-" + b,
          authorName: item.label,
          authorRole: item.label,
          timeAgo: "Direct Sheet Entry",
          text: blk
        });
      }
    }
  }
  return list;
}

function richTextToHtml(richTextValue) {
  if (!richTextValue) return "";
  var runs = richTextValue.getRuns();
  if (!runs || runs.length === 0) {
    var rawText = (richTextValue.getText() || "").replace(/[\r\n\s]+$/, "");
    return escapeHtml(rawText).replace(/\r\n|\n|\r/g, "<br/>");
  }
  var html = "";
  for (var r = 0; r < runs.length; r++) {
    var run = runs[r];
    var text = run.getText();
    if (!text) continue;
    var style = run.getTextStyle();
    var color = style.getForegroundColor();
    var isBold = style.isBold();
    var isItalic = style.isItalic();
    var isUnderline = style.isUnderline();

    var styles = [];
    var darkBodyColors = ["#000000", "#000", "#292f33", "#111827", "#1f2937", "#333333", "#434343", "#555555"];
    if (color && !darkBodyColors.includes(color.toLowerCase())) {
      styles.push("color:" + color);
    }
    if (isBold) styles.push("font-weight:700");
    if (isItalic) styles.push("font-style:italic");
    if (isUnderline) styles.push("text-decoration:underline");

    var escaped = escapeHtml(text).replace(/\r\n|\n|\r/g, "<br/>");
    if (styles.length > 0) {
      html += '<span style="' + styles.join(";") + '">' + escaped + '</span>';
    } else {
      html += escaped;
    }
  }
  // Clean trailing breaks and empty spaces from HTML output
  return html.replace(/(?:<br\s*\/?>|\s)+$/gi, "").trim();
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function apiSubmitReview(data) {
  var bookName = data.book || "Romans";
  var row = Number(data.row);
  var role = String(data.role || "").toUpperCase();
  var comment = data.comment;
  var confirm = data.confirm; // "Y" or "N"
  var userName = data.userName || "";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(bookName);
  if (!sheet) {
    return { success: false, error: "Book sheet not found: " + bookName };
  }
  if (!row || row < DATA_START_ROW || row > sheet.getLastRow()) {
    return { success: false, error: "Invalid row: " + row };
  }

  // Lock protection: If already finalized (Col R === "Y"), prevent edits
  var isFinalized = sheet.getRange(row, COL.FINAL_CONFIRM).getValue() === "Y";
  if (isFinalized) {
    return {
      success: false,
      error: "This verse is already finalized and locked (Col R = Y). Unlocking requires authorization from the Final Editor & Committee."
    };
  }

  var revCol = null;
  var confCol = null;
  var roleKeyword = "";

  switch (role) {
    case "TECH":
    case "TECHNICAL":
    case "TECHNICAL REVIEWER":
      revCol = COL.TECH_REV;
      confCol = COL.TECH_CONFIRM;
      roleKeyword = "technical";
      break;
    case "STYLE":
    case "STYLE & LANGUAGE":
    case "STYLE & LANGUAGE REVIEWER":
      revCol = COL.STYLE_REV;
      confCol = COL.STYLE_CONFIRM;
      roleKeyword = "style";
      break;
    case "ORTHO":
    case "ORTHOGRAPHIC":
    case "ORTHOGRAPHIC REVIEWER":
      revCol = COL.ORTHO_REV;
      confCol = COL.ORTHO_CONFIRM;
      roleKeyword = "ortho";
      break;
    case "THEO":
    case "THEOLOGICAL":
    case "THEOLOGICAL REVIEWER":
      revCol = COL.THEO_REV;
      confCol = COL.THEO_CONFIRM;
      roleKeyword = "theo";
      break;
    case "COMM":
    case "COMMITTEE":
      revCol = COL.CONCLUSION;
      confCol = COL.COMM_CONFIRM;
      roleKeyword = "comm";
      break;
    default:
      return { success: false, error: "Invalid or unsupported review role: " + role };
  }

  var currentVal = sheet.getRange(row, revCol).getValue() || "";
  var formattedComment = "";

  // Append formatted entry: author byline + approval tag or natural discussion note
  if (confirm === "Y") {
    formattedComment = (userName ? userName + ": " : "") + "[✓ Approved]" + (comment && String(comment).trim() ? " - " + String(comment).trim() : "");
  } else if (comment && String(comment).trim().length > 0) {
    formattedComment = (userName ? userName + ": " : "") + String(comment).trim();
  }

  if (formattedComment) {
    var newVal = currentVal ? (currentVal + "\n\n" + formattedComment) : formattedComment;
    sheet.getRange(row, revCol).setValue(newVal);
    currentVal = newVal;
  }

  // Multi-member approval engine: All active assigned members must approve before confCol turns "Y"
  if (confirm === "N") {
    sheet.getRange(row, confCol).setValue("N");
  } else if (confirm === "Y") {
    var allApproved = checkAllMembersApprovedGs(currentVal, roleKeyword);
    if (allApproved) {
      sheet.getRange(row, confCol).setValue("Y");
    } else {
      sheet.getRange(row, confCol).setValue("N");
    }
  }

  // Recalculate row status and color
  updateRowStatus(sheet, row);

  var newStatus = sheet.getRange(row, COL.STATUS).getValue();
  var verseRef = sheet.getRange(row, COL.VERSE).getValue();

  return {
    success: true,
    book: bookName,
    row: row,
    verse: verseRef,
    newStatus: newStatus,
    role: role,
    confirmed: sheet.getRange(row, confCol).getValue() === "Y"
  };
}

function checkAllMembersApprovedGs(cellText, roleKeyword) {
  var members = getAllActiveMembers();
  var required = [];
  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    if (m.role && m.role.toLowerCase().indexOf(roleKeyword.toLowerCase()) !== -1) {
      if (required.indexOf(m.name) === -1) {
        required.push(m.name);
      }
    }
  }
  if (required.length === 0) return true;

  for (var j = 0; j < required.length; j++) {
    var memberName = required[j];
    var regex = new RegExp("(^|\\n)" + escapeRegexGs(memberName) + ":\\s*(\\[✓\\s*Approved\\]|Approved)", "i");
    if (!regex.test(cellText)) {
      return false;
    }
  }
  return true;
}

function escapeRegexGs(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function apiSubmitFinal(data) {
  var bookName = data.book || "Romans";
  var row = Number(data.row);
  var finalReading = data.finalReading || "";
  var confirm = data.confirm || "Y";

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(bookName);
  if (!sheet) {
    return { success: false, error: "Book sheet not found: " + bookName };
  }
  if (!row || row < DATA_START_ROW || row > sheet.getLastRow()) {
    return { success: false, error: "Invalid row: " + row };
  }

  if (finalReading) {
    sheet.getRange(row, COL.FINAL).setValue(finalReading);
  }
  sheet.getRange(row, COL.FINAL_CONFIRM).setValue(confirm);

  updateRowStatus(sheet, row);
  var newStatus = sheet.getRange(row, COL.STATUS).getValue();
  var verseRef = sheet.getRange(row, COL.VERSE).getValue();

  // If finalized, lock row protection
  var isLocked = false;
  if (confirm === "Y") {
    try {
      var protection = sheet.getRange(row, 1, 1, 18).protect().setDescription("Finalized Row " + row + " (" + verseRef + ")");
      protection.removeEditors(protection.getEditors());
      isLocked = true;
    } catch (e) {
      // Protection may require sheet owner rights, log and continue
      console.warn("Row protection note:", e);
    }
  }

  return {
    success: true,
    book: bookName,
    row: row,
    verse: verseRef,
    newStatus: newStatus,
    locked: isLocked
  };
}

function apiImportVerses(data) {
  var bookName = data.book || "Romans";
  var verses = data.verses || [];
  if (!Array.isArray(verses) || verses.length === 0) {
    return { success: false, error: "No verses provided for import." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(bookName);
  if (!sheet) {
    return { success: false, error: "Book sheet not found: " + bookName };
  }

  var lastRow = sheet.getLastRow();
  var importedCount = 0;
  var newRowsCreated = 0;
  var rowMap = {};

  // Map existing verses in sheet by reference for quick row resolution
  if (lastRow >= DATA_START_ROW) {
    var range = sheet.getRange(DATA_START_ROW, COL.VERSE, lastRow - DATA_START_ROW + 1, 1);
    var vVals = range.getValues();
    for (var i = 0; i < vVals.length; i++) {
      var ref = String(vVals[i][0] || "").trim().toLowerCase().replace(/\s+/g, '');
      if (ref) {
        rowMap[ref] = DATA_START_ROW + i;
      }
    }
  }

  // Common Y/N validation rule for confirmation dropdowns
  var ynRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Y", "N"], true)
    .setAllowInvalid(false)
    .build();

  for (var v = 0; v < verses.length; v++) {
    var item = verses[v];
    var targetRow = item.row;
    var cleanRef = item.verse ? String(item.verse).trim().toLowerCase().replace(/\s+/g, '') : "";

    if (!targetRow && cleanRef) {
      targetRow = rowMap[cleanRef];
    }

    // Auto-create new row at bottom of sheet if verse not found
    if (!targetRow) {
      lastRow = sheet.getLastRow();
      targetRow = Math.max(DATA_START_ROW, lastRow + 1);

      // Populate Verse Ref in Col B
      if (item.verse) {
        sheet.getRange(targetRow, COL.VERSE).setValue(item.verse);
      }

      // Add Y/N dropdown validations to all 7 confirmation columns
      sheet.getRange(targetRow, COL.DRAFTER_CONFIRM).setDataValidation(ynRule);
      sheet.getRange(targetRow, COL.TECH_CONFIRM).setDataValidation(ynRule);
      sheet.getRange(targetRow, COL.STYLE_CONFIRM).setDataValidation(ynRule);
      sheet.getRange(targetRow, COL.ORTHO_CONFIRM).setDataValidation(ynRule);
      sheet.getRange(targetRow, COL.THEO_CONFIRM).setDataValidation(ynRule);
      sheet.getRange(targetRow, COL.COMM_CONFIRM).setDataValidation(ynRule);
      sheet.getRange(targetRow, COL.FINAL_CONFIRM).setDataValidation(ynRule);

      newRowsCreated++;
      if (cleanRef) {
        rowMap[cleanRef] = targetRow;
      }
    }

    // Write Old Reading (Col C) - RichText or plain value
    if (item.oldReadingSection && item.oldReadingSection.text) {
      writeRichTextToCell(sheet, targetRow, COL.OLD_READING, item.oldReadingSection);
    } else if (item.oldReading) {
      sheet.getRange(targetRow, COL.OLD_READING).setValue(item.oldReading);
    }

    // Write Proposed Reading (Col D) - RichText or plain value
    if (item.proposedSection && item.proposedSection.text) {
      writeRichTextToCell(sheet, targetRow, COL.PROPOSED, item.proposedSection);
    } else if (item.proposed) {
      sheet.getRange(targetRow, COL.PROPOSED).setValue(item.proposed);
    }

    // Write Drafter Comments (Col E) - RichText (tables, colored highlights) or plain value
    if (item.drafterCmtSection && item.drafterCmtSection.text) {
      writeRichTextToCell(sheet, targetRow, COL.DRAFTER_CMT, item.drafterCmtSection);
    } else if (item.drafterCmt) {
      sheet.getRange(targetRow, COL.DRAFTER_CMT).setValue(item.drafterCmt);
    }

    // Auto-confirm Drafter status (Col F) = "Y"
    sheet.getRange(targetRow, COL.DRAFTER_CONFIRM).setValue("Y");

    // Recalculate status and recolor Col A
    updateRowStatus(sheet, targetRow);
    importedCount++;
  }

  return {
    success: true,
    book: bookName,
    importedCount: importedCount,
    newRowsCreated: newRowsCreated,
    message: "Successfully imported " + importedCount + " verse(s) into " + bookName + (newRowsCreated > 0 ? " (" + newRowsCreated + " new rows created)." : ".")
  };
}

function apiGetAnalytics(bookName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(bookName);
  if (!sheet) {
    return { success: false, error: "Book sheet not found: " + bookName };
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) {
    return {
      success: true,
      book: bookName,
      total: 0,
      completed: 0,
      completionRate: 0,
      stages: {},
      bottlenecks: {}
    };
  }

  var numRows = lastRow - DATA_START_ROW + 1;
  var range = sheet.getRange(DATA_START_ROW, 1, numRows, 18);
  var values = range.getValues();

  var total = 0;
  var completed = 0;
  var notStarted = 0;
  var awaitingReview = 0;
  var underReview = 0;
  var awaitingCommittee = 0;
  var needsFinal = 0;

  var pendingTech = 0;
  var pendingStyle = 0;
  var pendingOrtho = 0;
  var pendingTheo = 0;
  var pendingComm = 0;
  var pendingFinal = 0;

  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var verseRef = r[COL.VERSE - 1];
    if (!verseRef) continue;
    total++;

    var status = r[COL.STATUS - 1];
    var drafterConf = r[COL.DRAFTER_CONFIRM - 1] === "Y";
    var techConf = r[COL.TECH_CONFIRM - 1] === "Y";
    var styleConf = r[COL.STYLE_CONFIRM - 1] === "Y";
    var orthoConf = r[COL.ORTHO_CONFIRM - 1] === "Y";
    var theoConf = r[COL.THEO_CONFIRM - 1] === "Y";
    var commConf = r[COL.COMM_CONFIRM - 1] === "Y";
    var finalConf = r[COL.FINAL_CONFIRM - 1] === "Y";

    if (status === "Done" || finalConf) {
      completed++;
    } else if (status === "Needs Final" || commConf) {
      needsFinal++;
      pendingFinal++;
    } else if (status === "Awaiting Committee" || (techConf && styleConf && orthoConf && theoConf)) {
      awaitingCommittee++;
      pendingComm++;
    } else if (status === "Under Review") {
      underReview++;
      if (!techConf) pendingTech++;
      if (!styleConf) pendingStyle++;
      if (!orthoConf) pendingOrtho++;
      if (!theoConf) pendingTheo++;
    } else if (status === "Awaiting Review" || drafterConf) {
      awaitingReview++;
      if (!techConf) pendingTech++;
      if (!styleConf) pendingStyle++;
      if (!orthoConf) pendingOrtho++;
      if (!theoConf) pendingTheo++;
    } else {
      notStarted++;
    }
  }

  var rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    success: true,
    book: bookName,
    total: total,
    completed: completed,
    completionRate: rate,
    stages: {
      notStarted: notStarted,
      awaitingReview: awaitingReview,
      underReview: underReview,
      awaitingCommittee: awaitingCommittee,
      needsFinal: needsFinal,
      done: completed
    },
    bottlenecks: {
      technical: pendingTech,
      style: pendingStyle,
      orthographic: pendingOrtho,
      theological: pendingTheo,
      committee: pendingComm,
      finalEditor: pendingFinal
    }
  };
}

function apiSyncProtections() {
  try {
    var res = applyColumnProtections(true);
    if (res && res.success === false) {
      return { success: false, error: res.error || "Failed to apply column protections." };
    }
    return {
      success: true,
      message: "Column protections successfully synced across " + (res.sheetCount || 0) + " sheet(s).",
      sheetCount: res.sheetCount,
      membersCount: res.membersCount
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function apiInitBookSheet(data) {
  var bookName = (data && data.book) ? String(data.book).trim() : "";
  if (!bookName) {
    return { success: false, error: "Missing book name for initialization." };
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(bookName);
  var isNew = false;
  if (!sheet) {
    sheet = ss.insertSheet(bookName);
    isNew = true;
  }

  var headers = [
    "Status", "Verse Ref", "Old Reading (KJV)", "Proposed Reading", "Drafter Comments", "Drafter Confirm (Y/N)", 
    "Technical Review", "Tech Confirm (Y/N)", 
    "Style & Language Review", "Style Confirm (Y/N)", 
    "Orthographic Review", "Ortho Confirm (Y/N)", 
    "Theological Review", "Theo Confirm (Y/N)", 
    "Committee Conclusion", "Comm Confirm (Y/N)", 
    "Final Reading", "Final Confirm (Y/N)"
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var hdr = sheet.getRange(1, 1, 1, headers.length);
  hdr.setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#1F4E79")
    .setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);

  sheet.getRange(1, COL.STATUS).setBackground("#1E5C29");
  sheet.getRange(1, COL.VERSE).setBackground("#2F4F8F");
  sheet.getRange(1, COL.OLD_READING).setBackground("#2F4F8F");
  sheet.getRange(1, COL.PROPOSED).setBackground("#15609A");
  sheet.getRange(1, COL.DRAFTER_CMT).setBackground("#15609A");
  sheet.getRange(1, COL.DRAFTER_CONFIRM).setBackground("#15609A");

  sheet.getRange(1, COL.TECH_REV, 1, 2).setBackground("#6B30A0");
  sheet.getRange(1, COL.STYLE_REV, 1, 2).setBackground("#0070C0");
  sheet.getRange(1, COL.ORTHO_REV, 1, 2).setBackground("#990099");
  sheet.getRange(1, COL.THEO_REV, 1, 2).setBackground("#A61C00");

  sheet.getRange(1, COL.CONCLUSION, 1, 2).setBackground("#C55A11");
  sheet.getRange(1, COL.FINAL, 1, 2).setBackground("#1E5C29");

  sheet.setColumnWidth(COL.STATUS, 130);
  sheet.setColumnWidth(COL.VERSE, 80);
  sheet.setColumnWidth(COL.OLD_READING, 210);
  sheet.setColumnWidth(COL.PROPOSED, 220);
  sheet.setColumnWidth(COL.DRAFTER_CMT, 190);
  sheet.setColumnWidth(COL.DRAFTER_CONFIRM, 100);

  sheet.setColumnWidth(COL.TECH_REV, 190); sheet.setColumnWidth(COL.TECH_CONFIRM, 100);
  sheet.setColumnWidth(COL.STYLE_REV, 190); sheet.setColumnWidth(COL.STYLE_CONFIRM, 100);
  sheet.setColumnWidth(COL.ORTHO_REV, 190); sheet.setColumnWidth(COL.ORTHO_CONFIRM, 100);
  sheet.setColumnWidth(COL.THEO_REV, 190); sheet.setColumnWidth(COL.THEO_CONFIRM, 100);
  sheet.setColumnWidth(COL.CONCLUSION, 210); sheet.setColumnWidth(COL.COMM_CONFIRM, 100);
  sheet.setColumnWidth(COL.FINAL, 230); sheet.setColumnWidth(COL.FINAL_CONFIRM, 100);

  sheet.getRange(2, 1, 300, headers.length).setWrap(true).setVerticalAlignment("top");

  var ynVal = SpreadsheetApp.newDataValidation().requireValueInList(["Y", "N"], true).build();
  sheet.getRange(2, COL.DRAFTER_CONFIRM, 300).setDataValidation(ynVal);
  sheet.getRange(2, COL.TECH_CONFIRM, 300).setDataValidation(ynVal);
  sheet.getRange(2, COL.STYLE_CONFIRM, 300).setDataValidation(ynVal);
  sheet.getRange(2, COL.ORTHO_CONFIRM, 300).setDataValidation(ynVal);
  sheet.getRange(2, COL.THEO_CONFIRM, 300).setDataValidation(ynVal);
  sheet.getRange(2, COL.COMM_CONFIRM, 300).setDataValidation(ynVal);
  sheet.getRange(2, COL.FINAL_CONFIRM, 300).setDataValidation(ynVal);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  sheet.setRowHeight(1, 45);

  applyColumnProtections(true);

  return {
    success: true,
    book: bookName,
    isNew: isNew,
    message: "Translation sheet '" + bookName + "' initialized and protected with 18 GLBC columns successfully!"
  };
}
