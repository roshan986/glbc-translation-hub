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
                                                                                                
function getAllConfigMembers() {
  var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG_SHEET_NAME);
  if (!configSheet) return [];
  var data = configSheet.getDataRange().getValues();
  var members = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    members.push({
      name: String(row[0]).trim(),
      role: String(row[1]).trim(),
      phone: String(row[2]).trim(),
      email: String(row[3]).trim(),
      active: String(row[4]).trim().toLowerCase() === "yes"
    });
  }
  return members;
}

function apiSaveMember(data) {
  var name = String(data.name || "").trim();
  var email = String(data.email || "").trim().toLowerCase();
  var phone = String(data.phone || "").replace(/[^0-9]/g, "");
  var active = data.active !== false ? "Yes" : "No";
  var roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : [String(data.role || "Drafter").trim()];
  var origEmail = String(data.originalEmail || "").trim().toLowerCase();
  var origName = String(data.originalName || "").trim().toLowerCase();

  if (!name || !email) {
    return { success: false, error: "Name and Google Email are required." };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
  if (!configSheet) {
    return { success: false, error: "Config sheet not found." };
  }

  var lastRow = configSheet.getLastRow();
  var existingData = lastRow > 1 ? configSheet.getRange(2, 1, lastRow - 1, 5).getValues() : [];

  // Remove existing rows matching this member
  for (var i = existingData.length - 1; i >= 0; i--) {
    var rEmail = String(existingData[i][3] || "").trim().toLowerCase();
    var rName = String(existingData[i][0] || "").trim().toLowerCase();

    var matches = (origEmail && rEmail === origEmail) || (origName && rName === origName) || (rEmail === email);
    if (matches) {
      configSheet.deleteRow(i + 2);
    }
  }

  // Add a row for each assigned role
  for (var k = 0; k < roles.length; k++) {
    configSheet.appendRow([name, roles[k], phone, email, active]);
  }

  // Re-sync column protections across all translation sheets
  applyColumnProtections(true);

  var updatedMembers = getAllConfigMembers();
  return {
    success: true,
    message: "Member '" + name + "' saved with " + roles.length + " role(s) and protections synced.",
    team: updatedMembers
  };
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

