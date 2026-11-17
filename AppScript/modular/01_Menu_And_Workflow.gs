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
                                                                                                