// ================================================================                             
//  GLBC Bible Translation Workflow — wa.me Click-to-Send Version
//  Version 3.2  |  Highlight color to text color conversion with auto-bold
// ================================================================

var CONFIG_SHEET_NAME = "⚙ Config";

var COL = {                                                                                     
  STATUS:          1,   // A
  VERSE:           2,   // B                                                                    
  OLD_READING:     3,   // C
  PROPOSED:        4,   // D                                                                    
  DRAFTER_CMT:     5,   // E                                                                    
  DRAFTER_CONFIRM: 6,   // F
  TECH_REV:        7,   // G
  TECH_CONFIRM:    8,   // H
  STYLE_REV:       9,   // I
  STYLE_CONFIRM:   10,  // J
  ORTHO_REV:       11,  // K
  ORTHO_CONFIRM:   12,  // L
  THEO_REV:        13,  // M
  THEO_CONFIRM:    14,  // N
  CONCLUSION:      15,  // O
  COMM_CONFIRM:    16,  // P
  FINAL:           17,  // Q
  FINAL_CONFIRM:   18   // R
};                                                                                              
                                                                                                
var DATA_START_ROW = 2;                                                                         
                                                                                                
var COLOR = {
  GREEN:  "#00B050",                                                                            
  YELLOW: "#FFC000",
  RED:    "#FF0000",                                                                            
  NONE:   "#FFFFFF"                                                                             
};                                                                                              
                                                                                                
function isBookSheet(sheetName) {                                                               
  if (!sheetName) return false;
  var name = String(sheetName).trim();
  if (name === CONFIG_SHEET_NAME) return false;
  if (/^sheet\s*\d+$/i.test(name)) return false;
  return true;                                                       
}                                                                                               
                                                                                                
function getAllBookSheets() {                                                                   
  return SpreadsheetApp.getActiveSpreadsheet().getSheets()                                      
    .filter(function(s) { return isBookSheet(s.getName()); });                                  
}                                                                                               
                                                                                                
// ================================================================                             
//  MENU                                                                                        
// ================================================================                             
function onOpen() {                                                                             
  SpreadsheetApp.getUi()                                                                        
    .createMenu("📖 GLBC")                                                                      
    .addItem("1️⃣  Format This Sheet", "setupTranslationSheet")                                  
    .addItem("2️⃣  Create Config Sheet", "setupConfigSheet")                                     
    .addSeparator()                                                                             
    .addItem("📨  Send Alerts for Current Row", "showAlertUi")                                  
    .addItem("📊  Generate Weekly Summary", "showWeeklySummaryUi")                              
    .addSeparator()
    .addItem("📥  Import Drafter Doc", "showImportDrafterDocUi")
    .addItem("📄  Download Drafter Template", "downloadDrafterTemplate")
    .addItem("🔑  Authorize Import Feature (run once)", "authorizeImportFeature")
    .addSeparator()                                                                             
    .addItem("🔄  Refresh Status Colors", "refreshAllStatuses")                                 
    .addItem("🔒  Protect Finalized Verses", "protectFinalizedRows")                            
    .addItem("🛡️  Apply Column Protections by Role", "applyColumnProtections")
    .addItem("⚡  Enable Auto-Sync Protections", "setupAutoSyncTrigger")
    .addToUi();                                                                                 
}                                                                                               
                                                                                                
// ================================================================                             
//  AUTO-COLOR ON EDIT                                                                          
// ================================================================                             
function onEdit(e) {                                                                            
  var range = e.range;                                                                          
  var sheet = range.getSheet();                                                                 
  if (!isBookSheet(sheet.getName())) return;                                                    
  if (range.getRow() < DATA_START_ROW) return;                                                  
  if (!sheet.getRange(range.getRow(), COL.VERSE).getValue()) return;                            
                                                                                                
  // Update status based on confirmations
  updateRowStatus(sheet, range.getRow());                                                       
}                                                                                               
                                                                                                
function updateRowStatus(sheet, row) {                                                          
  var proposed        = sheet.getRange(row, COL.PROPOSED).getValue();                              
  var drafterConf     = sheet.getRange(row, COL.DRAFTER_CONFIRM).getValue() === "Y";
  
  var techConf        = sheet.getRange(row, COL.TECH_CONFIRM).getValue() === "Y";
  var styleConf       = sheet.getRange(row, COL.STYLE_CONFIRM).getValue() === "Y";
  var orthoConf       = sheet.getRange(row, COL.ORTHO_CONFIRM).getValue() === "Y";
  var theoConf        = sheet.getRange(row, COL.THEO_CONFIRM).getValue() === "Y";
  
  var conclusionConf  = sheet.getRange(row, COL.COMM_CONFIRM).getValue() === "Y";
  var finalReading    = sheet.getRange(row, COL.FINAL).getValue();                                 
  var finalConf       = sheet.getRange(row, COL.FINAL_CONFIRM).getValue() === "Y";                               
                                                                                                
  var statusCell = sheet.getRange(row, COL.STATUS);                                             
  var color, label;                                                                             
                                                                                                
  if (finalReading && finalConf) {                                                                           
    color = COLOR.GREEN;  label = "Done";                                                       
  } else if (!proposed || !drafterConf) {                                                                       
    color = COLOR.RED;    label = "Not Started";                                                
  } else if (conclusionConf) {                                                                      
    color = COLOR.YELLOW; label = "Needs Final";                                                
  } else if (techConf || styleConf || orthoConf || theoConf) {
    if (techConf && styleConf && orthoConf && theoConf) {
       color = COLOR.YELLOW; label = "Awaiting Committee";
    } else {
       color = COLOR.YELLOW; label = "Under Review";                                               
    }
  } else {                                                                                      
    color = COLOR.YELLOW; label = "Awaiting Review";                                            
  }                                                                                             
                                                                                                
  statusCell.setBackground(color);                                                              
  statusCell.setValue(label);                                                                   
  statusCell.setFontColor((finalReading && finalConf) ? "#FFFFFF" : "#000000");                                
}                                                                                               

// ================================================================                             
//  WA.ME UI GENERATOR (Popup to click links)                                                   
// ================================================================                             

function showAlertUi() {                                                                        
  var ui    = SpreadsheetApp.getUi();                                                           
  var sheet = SpreadsheetApp.getActiveSheet();                                                  
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();                                
                                                                                                
  if (!isBookSheet(sheet.getName())) {                                                          
    ui.alert("Please run this from a translation book tab, not the Config tab.");               
    return;                                                                                     
  }                                                                                             
                                                                                                
  var row = sheet.getActiveCell().getRow();                                                     
  if (row < DATA_START_ROW) {                                                                   
    ui.alert("Please click inside a valid verse row first.");                                   
    return;                                                                                     
  }                                                                                             
                                                                                                
  var verseRef     = sheet.getRange(row, COL.VERSE).getValue();                                 
  var proposed     = sheet.getRange(row, COL.PROPOSED).getValue();
  var drafterConf  = sheet.getRange(row, COL.DRAFTER_CONFIRM).getValue() === "Y";                              
  var finalReading = sheet.getRange(row, COL.FINAL).getValue();                                 
  var finalConf    = sheet.getRange(row, COL.FINAL_CONFIRM).getValue() === "Y";
  var bookName     = sheet.getName();                                                           
                                                                                                
  if (!verseRef) {                                                                              
    ui.alert("This row has no verse reference.");                                               
    return;                                                                                     
  }                                                                                             
                                                                                                
  var targetGroup = [];                                                                         
  var message     = "";                                                                         
  var stageName   = "";                                                                         
                                                                                                
  var techConf        = sheet.getRange(row, COL.TECH_CONFIRM).getValue() === "Y";
  var styleConf       = sheet.getRange(row, COL.STYLE_CONFIRM).getValue() === "Y";
  var orthoConf       = sheet.getRange(row, COL.ORTHO_CONFIRM).getValue() === "Y";
  var theoConf        = sheet.getRange(row, COL.THEO_CONFIRM).getValue() === "Y";
  var conclusionConf  = sheet.getRange(row, COL.COMM_CONFIRM).getValue() === "Y";
  
  if (finalReading && finalConf) {                                                                           
    targetGroup = getAllActiveMembers();                                                        
    stageName   = "Verse Finalized";                                                            
    message     = "*GLBC Translation - Verse Finalized!*\n\nBook: *" + bookName + "* | *" +     
verseRef + "* is complete.\n\nFinal Reading:\n_\"" + finalReading + "\"_\n\nThank you all for your contribution!\n\nLink to Sheet: " + sheetUrl;                                                     
                                                                                                
  } else if (conclusionConf) {                                                                      
    targetGroup = getTeamByRole("Final Editor");                                                     
    stageName   = "Conclusion Ready";                                                           
    message     = "*GLBC Translation - Conclusion Ready!*\n\nBook: *" + bookName + "* | Verse: *" + verseRef + "*\n\nThe Committee has confirmed the conclusion.\n\nPlease enter the *Final Reading* and confirm 'Y'.\n\nLink to Sheet: " + sheetUrl;                                             
                                                                                                
  } else if (techConf && styleConf && orthoConf && theoConf) {                                                    
    targetGroup = getTeamByRole("Committee");                                                   
    stageName   = "Review Complete";                                                            
    message     = "*GLBC Translation - Committee Action Required!*\n\nBook: *" + bookName + "* | Verse: *" + verseRef + "*\n\nAll reviewers have confirmed their reviews.\n\nPlease open the sheet, read the comments, and enter the *Committee Conclusion*.\n\nLink to Sheet: " + sheetUrl;        
                                                                                                
  } else if (drafterConf && proposed) {                                                                        
    // Send to whichever reviewers have NOT confirmed yet
    targetGroup = [];
    if (!techConf) targetGroup = targetGroup.concat(getTeamByRole("Technical Reviewer"));
    if (!styleConf) targetGroup = targetGroup.concat(getTeamByRole("Style & Language Reviewer"));
    if (!orthoConf) targetGroup = targetGroup.concat(getTeamByRole("Orthographic Reviewer"));
    if (!theoConf) targetGroup = targetGroup.concat(getTeamByRole("Theological Reviewer"));
    
    stageName   = "Proposed Reading Ready (Pending Reviews)";                                                     
    message     = "*GLBC Translation - Action Needed!*\n\nBook: *" + bookName + "* | Verse: *" +
verseRef + "*\n\nThe drafter has finalized the *Proposed Reading*.\n\n_\"" + proposed +             
"\"_\n\nPlease open the sheet, add your review, and select 'Y' in your Confirm column.\n\nLink to Sheet: " + sheetUrl;              
                                                                                                
  } else {                                                                                      
    ui.alert("There is nothing to send yet. The Proposed Reading is not confirmed by the Drafter (needs 'Y' in Drafter Confirm column).");                   
    return;                                                                                     
  }                                                                                             
                                                                                                
  if (targetGroup.length === 0) {                                                               
    ui.alert("No active team members found for this stage.");                                   
    return;                                                                                     
  }                                                                                             
                                                                                                
  var htmlTemplate = "<style>"                                                                  
    + "body { font-family: Arial, sans-serif; padding: 10px; }"                                 
    + ".btn { display: block; padding: 12px; margin: 10px 0; background: #25D366; color: white; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold; }"              
    + ".btn:hover { background: #128C7E; }"                                                     
    + "p { color: #555; }"                                                                      
    + "</style>"                                                                                
    + "<h3>Stage: " + stageName + "</h3>"                                                       
    + "<p>Click the buttons below to send the message. This will open WhatsApp Web on your computer, or the WhatsApp app on your phone.</p>";                                                
                                                                                                
  targetGroup.forEach(function(person) {                                                        
    var link = "https://wa.me/" + person.phone + "?text=" + encodeURIComponent(message);        
    htmlTemplate += "<a class='btn' href='" + link + "' target='_blank'>Send to " + person.name +
" (" + person.role + ")</a>";                                                                     
  });                                                                                           
                                                                                                
  htmlTemplate += "<hr><p style='font-size:12px;'><i>Tip: After clicking a button, come back to this window to click the next person. Close this window when done.</i></p>";                      
                                                                                                
  var htmlOutput = HtmlService.createHtmlOutput(htmlTemplate)                                   
      .setWidth(400)                                                                            
      .setHeight(400);                                                                          
                                                                                                
  ui.showModalDialog(htmlOutput, "📨 Send WhatsApp Alerts");                                    
}                                                                                               
                                                                                                                                                                                                
// ================================================================                             
//  WEEKLY SUMMARY (Manual UI)                                                                  
// ================================================================                             
function showWeeklySummaryUi() {                                                                
  var ui         = SpreadsheetApp.getUi();                                                      
  var bookSheets = getAllBookSheets();                                                          
  if (bookSheets.length === 0) return;                                                          
                                                                                                
  var today    = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd MMM yyyy");               
  var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();                                
                                                                                                
  var overallDone = 0, overallProgress = 0, overallNotStarted = 0, overallTotal = 0;            
  var bookLines   = "";                                                                         
                                                                                                
  bookSheets.forEach(function(sheet) {                                                          
    var lastRow = sheet.getLastRow();                                                           
    var done = 0, inProgress = 0, notStarted = 0, total = 0;                                    
                                                                                                
    for (var row = DATA_START_ROW; row <= lastRow; row++) {                                     
      var verse = sheet.getRange(row, COL.VERSE).getValue();                                    
      if (!verse) continue;                                                                     
      total++;                                                                                  
      var proposed     = sheet.getRange(row, COL.PROPOSED).getValue();                          
      var finalReading = sheet.getRange(row, COL.FINAL).getValue();                             
      var finalConf    = sheet.getRange(row, COL.FINAL_CONFIRM).getValue() === "Y";
                                                                                                
      if (finalReading && finalConf) done++;                                                              
      else if (proposed)             inProgress++;                                                        
      else                           notStarted++;                                                        
    }                                                                                           
                                                                                                
    if (total === 0) return;                                                                    
                                                                                                
    var pct = Math.round((done / total) * 100);                                                 
    bookLines += "\n*" + sheet.getName() + "*\n"                                                
      + "  Done: " + done + "  In Progress: " + inProgress + "  Pending: " + notStarted         
      + "  (" + pct + "%)\n";                                                                   
    overallDone       += done;                                                                  
    overallProgress   += inProgress;                                                            
    overallNotStarted += notStarted;                                                            
    overallTotal      += total;                                                                 
  });                                                                                           
                                                                                                
  var overallPct = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;       
                                                                                                
  var message = "*GLBC Weekly Translation Report*\n_" + today + "_\n═══════════════════════\n"  
    + bookLines                                                                                 
    + "═══════════════════════\nOverall: *" + overallDone + " / " + overallTotal + " verses done (" + overallPct + "%)*\n\nLink to Sheet: " + sheetUrl;                                            
                                                                                                
  var targetGroup = getAllActiveMembers();                                                      
                                                                                                
  var htmlTemplate = "<style>"                                                                  
    + "body { font-family: Arial, sans-serif; padding: 10px; }"                                 
    + ".btn { display: block; padding: 12px; margin: 10px 0; background: #25D366; color: white; text-decoration: none; border-radius: 5px; text-align: center; font-weight: bold; }"              
    + ".btn:hover { background: #128C7E; }"                                                     
    + "textarea { width: 100%; height: 150px; padding: 10px; box-sizing: border-box; font-family: monospace; }"                                                                             
    + "p { color: #555; }"                                                                      
    + "</style>"                                                                                
    + "<h3>Weekly Summary Ready</h3>"                                                           
    + "<p>You can copy the text below to paste into a WhatsApp Group, OR click the buttons to send to people individually.</p>"                                                                 
    + "<textarea readonly>" + message + "</textarea><br/>";                                     
                                                                                                
  targetGroup.forEach(function(person) {                                                        
    var link = "https://wa.me/" + person.phone + "?text=" + encodeURIComponent(message);        
    htmlTemplate += "<a class='btn' href='" + link + "' target='_blank'>Send to " + person.name +
"</a>";                                                                                           
  });                                                                                           
                                                                                                
  var htmlOutput = HtmlService.createHtmlOutput(htmlTemplate).setWidth(400).setHeight(500);     
  ui.showModalDialog(htmlOutput, "📊 Send Weekly Summary");                                     
}                                                                                               
                                                                                                
// ================================================================                             
//  CONFIG SHEET                                                                                
// ================================================================                             
function getAllActiveMembers() {                                                                
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);    
  if (!configSheet) return [];                                                                  
  var data    = configSheet.getDataRange().getValues();                                         
  var members = [];                                                                             
  for (var i = 1; i < data.length; i++) {                                                       
    var row    = data[i];                                                                       
    if (String(row[4]).trim().toLowerCase() === "yes") { // Col E is Active now                                       
      members.push({                                                                            
        name:   row[0],                                                                         
        role:   String(row[1]).trim(),                                                          
        phone:  String(row[2]).trim(),
        email:  String(row[3]).trim(), // Added email for permissions
        active: true
      });                                                                                       
    }                                                                                           
  }                                                                                             
  return members;                                                                               
}                                                                                               
                                                                                                
function getTeamByRole(role) {                                                                  
  return getAllActiveMembers().filter(function(m) { return m.role.toLowerCase() === role.       
toLowerCase(); });                                                                                
}                                                                                               
                                                                                                
function setupConfigSheet() {                                                                   
  var ss = SpreadsheetApp.getActiveSpreadsheet();                                               
  var configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);                                       
                                                                                                
  if (configSheet) {                                                                            
    var ui = SpreadsheetApp.getUi();                                                            
    if (ui.alert("Config exists.", "RESET it? (Erases data)", ui.ButtonSet.YES_NO) !== ui.      
Button.YES) return;                                                                               
    ss.deleteSheet(configSheet);                                                                
  }                                                                                             
                                                                                                
  configSheet = ss.insertSheet(CONFIG_SHEET_NAME);                                              
  var headers = ["Name", "Role", "Phone (no + sign)", "Google Email", "Active (Yes/No)"];                       
  configSheet.getRange(1, 1, 1, 5).setValues([headers])                                         
    .setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#4472C4").                    
setHorizontalAlignment("center");                                                                 
                                                                                                
  var sampleData = [                                                                            
    ["Kishore",    "Drafter",                     "919876543210", "drafter@example.com",   "Yes"],                                      
    ["Sudhir",     "Technical Reviewer",          "919876543211", "tech@example.com",      "Yes"],                                      
    ["Anita",      "Style & Language Reviewer",   "919876543212", "style@example.com",     "Yes"],
    ["John",       "Orthographic Reviewer",       "919876543213", "ortho@example.com",     "Yes"],
    ["Mary",       "Theological Reviewer",        "919876543214", "theo@example.com",      "Yes"],
    ["Pastor Zack","Committee",                   "919876543215", "comm@example.com",      "Yes"],  
    ["David",      "Final Editor",                "919876543216", "final@example.com",     "Yes"],                                      
  ];                                                                                            
  configSheet.getRange(2, 1, sampleData.length, 5).setValues(sampleData);                       
                                                                                                
  var roles = ["Drafter", "Technical Reviewer", "Style & Language Reviewer", "Orthographic Reviewer", "Theological Reviewer", "Committee", "Final Editor"];
  var roleVal = SpreadsheetApp.newDataValidation().requireValueInList(roles, true).build();                                                                      
  configSheet.getRange(2, 2, 50).setDataValidation(roleVal);                                    
  var activeVal = SpreadsheetApp.newDataValidation().requireValueInList(["Yes", "No"], true).   
build();                                                                                          
  configSheet.getRange(2, 5, 50).setDataValidation(activeVal);                                  
                                                                                                
  configSheet.getRange(1, 7).setValue("📌 HOW TO ADD TEAM MEMBERS").setFontWeight("bold").      
setBackground("#FFE599");                                                                         
  var instructions = [                                                                          
    "Just type the name, role, phone, and Google Email of each person.",       
    "Phone format: 919876543210 (Country code first, no + sign, no spaces).",                   
    "Google Email: Essential for column protections (so they can only edit their columns).",
    "",                                                                                         
    "Roles must be chosen exactly from the dropdowns."                         
  ];                                                                                            
  for (var i = 0; i < instructions.length; i++) {                                               
    configSheet.getRange(i + 2, 7).setValue(instructions[i]).setBackground("#FFF2CC");          
  }                                                                                             
  configSheet.setColumnWidth(7, 450);                                                           
  configSheet.autoResizeColumns(1, 5);                                                          
  configSheet.setFrozenRows(1);                                                                 
                                                                                                
  SpreadsheetApp.getUi().alert("✅ Config sheet created! Fill in your team members and emails.");          
}                                                                                               
                                                                                                
// ================================================================                             
//  FORMATTING & PROTECTIONS                                                                          
// ================================================================                             
function setupTranslationSheet() {                                                              
  var sheet = SpreadsheetApp.getActiveSheet();                                                  
  var name  = sheet.getName();                                                                  
  if (name === CONFIG_SHEET_NAME) {                                                             
    SpreadsheetApp.getUi().alert("⚠️ Switch to a book tab (e.g. Romans) first.");               
    return;                                                                                     
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
  hdr.setFontWeight("bold").setFontColor("#FFFFFF").setBackground("#1F4E79").                   
setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);                    
                                                                                                
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
                                                                                                
  // Widths
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
  
  // Add Y/N dropdowns for Confirm columns
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
                                                                                                
  // Automatically apply protections so the new sheet is fully locked down based on the config
  applyColumnProtections();
  
  SpreadsheetApp.getUi().alert("✅ \"" + name + "\" formatted with new columns and protected!");                               
}                                                                                               
 
function protectFinalizedRows() {                                                               
  var sheet = SpreadsheetApp.getActiveSheet();                                                  
  if (!isBookSheet(sheet.getName())) return;                                                    
  var lastRow = sheet.getLastRow(), protected = 0;                                              
  for (var row = DATA_START_ROW; row <= lastRow; row++) {                                       
    var isFinalConf = sheet.getRange(row, COL.FINAL_CONFIRM).getValue() === "Y";
    if (isFinalConf) {                                            
      var protection = sheet.getRange(row, 1, 1, 18).protect().setDescription("Finalized");     
      protection.removeEditors(protection.getEditors());                                        
      protected++;                                                                              
    }                                                                                           
  }                                                                                             
  SpreadsheetApp.getUi().alert("🔒 " + protected + " finalized verse(s) protected.");           
}

function applyColumnProtections(isHeadless) {
  var sheets = getAllBookSheets();
  if (sheets.length === 0) {
    if (!isHeadless) {
      try { SpreadsheetApp.getUi().alert("No Translation sheets found."); } catch(e) {}
    }
    return { success: false, error: "No Translation sheets found." };
  }
  
  var members = getAllActiveMembers();
  if (members.length === 0) {
    if (!isHeadless) {
      try { SpreadsheetApp.getUi().alert("No active members found in Config sheet."); } catch(e) {}
    }
    return { success: false, error: "No active members found in Config sheet." };
  }
  
  var runnerEmail = Session.getEffectiveUser().getEmail();
  var docOwner = SpreadsheetApp.getActiveSpreadsheet().getOwner();
  var docOwnerEmail = docOwner ? docOwner.getEmail() : null;
  
  // Mapping roles to columns
  var roleColumns = {
    "Drafter": [COL.PROPOSED, COL.DRAFTER_CMT, COL.DRAFTER_CONFIRM],
    "Technical Reviewer": [COL.TECH_REV, COL.TECH_CONFIRM],
    "Style & Language Reviewer": [COL.STYLE_REV, COL.STYLE_CONFIRM],
    "Orthographic Reviewer": [COL.ORTHO_REV, COL.ORTHO_CONFIRM],
    "Theological Reviewer": [COL.THEO_REV, COL.THEO_CONFIRM],
    "Committee": [COL.CONCLUSION, COL.COMM_CONFIRM],
    "Final Editor": [COL.FINAL, COL.FINAL_CONFIRM]
  };
  
  sheets.forEach(function(sheet) {
    // Remove existing column protections to reset
    var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    for (var i = 0; i < protections.length; i++) {
      if (protections[i].getDescription() && protections[i].getDescription().indexOf(" Only") > -1) {
        protections[i].remove();
      }
    }

    for (var role in roleColumns) {
      var cols = roleColumns[role];
      // Gather emails for this role
      var emails = members.filter(function(m) { return m.role === role && m.email; })
                          .map(function(m) { return m.email.toLowerCase(); });
      
      // Ensure the script runner and the document owner are always retained
      if (runnerEmail && emails.indexOf(runnerEmail.toLowerCase()) === -1) emails.push(runnerEmail.toLowerCase());
      if (docOwnerEmail && emails.indexOf(docOwnerEmail.toLowerCase()) === -1) emails.push(docOwnerEmail.toLowerCase());
      
      // Apply protection
      cols.forEach(function(colNum) {
        var range = sheet.getRange(2, colNum, sheet.getMaxRows() - 1, 1);
        var protection = range.protect().setDescription(role + " Only");
        
        var currentEditors = protection.getEditors();
        var editorsToRemove = [];
        for (var j = 0; j < currentEditors.length; j++) {
          var edEmail = currentEditors[j].getEmail().toLowerCase();
          
          var isOwner = (docOwnerEmail && edEmail === docOwnerEmail.toLowerCase());
          var isAssigned = (emails.indexOf(edEmail) !== -1);
          
          // Only remove if they are neither the owner nor assigned to this role
          if (!isOwner && !isAssigned) {
            editorsToRemove.push(currentEditors[j]);
          }
        }
        
        try {
          if (editorsToRemove.length > 0) {
            protection.removeEditors(editorsToRemove);
          }
        } catch(e) {
          // Ignore removal errors if any
        }
        
        // Disable domain-wide edit access if applicable
        if (protection.canDomainEdit()) {
          protection.setDomainEdit(false);
        }
        
        try {
          if (emails.length > 0) {
            protection.addEditors(emails);
          }
        } catch(e) {
          // Ignore if an email is invalid or can't be added
        }
      });
    }
  });
  
  if (!isHeadless) {
    try {
      SpreadsheetApp.getUi().alert("🛡️ Column protections successfully applied to ALL " + sheets.length + " translation sheet(s) based on Config emails!");
    } catch(e) {}
  }
  return { success: true, sheetCount: sheets.length, membersCount: members.length };
}
                                                                                                
function refreshAllStatuses() {                                                                 
  var sheet = SpreadsheetApp.getActiveSheet();                                                  
  if (!isBookSheet(sheet.getName())) return;                                                    
  var lastRow = sheet.getLastRow(), count = 0;                                                  
  for (var row = DATA_START_ROW; row <= lastRow; row++) {                                       
    if (sheet.getRange(row, COL.VERSE).getValue()) { updateRowStatus(sheet, row); count++; }    
  }                                                                                             
  SpreadsheetApp.getUi().alert("✅ Status refreshed for " + count + " rows.");                  
}

// ================================================================                             
//  AUTO-SYNC TRIGGERS                                                                          
// ================================================================                             

function setupAutoSyncTrigger() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // First, remove any existing trigger to avoid duplicates
  var triggers = ScriptApp.getUserTriggers(ss);
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onConfigEditInstallable") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // Create a new installable onEdit trigger
  ScriptApp.newTrigger("onConfigEditInstallable")
    .forSpreadsheet(ss)
    .onEdit()
    .create();
    
  SpreadsheetApp.getUi().alert("⚡ Auto-Sync Enabled!\n\nWhenever you make changes to the '⚙ Config' sheet, the system will automatically run in the background to sync your column protections.");
}

function onConfigEditInstallable(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  
  // Only trigger protection update if the Config sheet was edited
  if (sheet.getName() === CONFIG_SHEET_NAME) {
    applyColumnProtections();
  }
}


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
  var members = getAllConfigMembers();
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
    var rawText = richTextValue.getText() || "";
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
    if (color && color.toLowerCase() !== "#000000" && color.toLowerCase() !== "#000") {
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
  return html;
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

  for (var v = 0; v < verses.length; v++) {
    var item = verses[v];
    var targetRow = item.row;
    if (!targetRow && item.verse) {
      var cleanRef = String(item.verse).trim().toLowerCase().replace(/\s+/g, '');
      targetRow = rowMap[cleanRef];
    }
    if (!targetRow) continue;

    if (item.oldReading) {
      sheet.getRange(targetRow, COL.OLD_READING).setValue(item.oldReading);
    }
    if (item.proposed) {
      sheet.getRange(targetRow, COL.PROPOSED).setValue(item.proposed);
    }
    if (item.drafterCmt) {
      sheet.getRange(targetRow, COL.DRAFTER_CMT).setValue(item.drafterCmt);
    }
    sheet.getRange(targetRow, COL.DRAFTER_CONFIRM).setValue("Y");

    updateRowStatus(sheet, targetRow);
    importedCount++;
  }

  return {
    success: true,
    book: bookName,
    importedCount: importedCount,
    message: "Successfully imported " + importedCount + " verse(s) into " + bookName + "."
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
