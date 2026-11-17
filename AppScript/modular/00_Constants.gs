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
                                                                                                