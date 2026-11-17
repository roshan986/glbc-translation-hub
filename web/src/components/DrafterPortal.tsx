import React, { useState, useRef } from 'react';
import type { VerseItem, ParsedImportVerse } from '../types';
import {
  FileUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  Palette
} from 'lucide-react';
import { extractDocxBlocks, groupBlocksIntoVerses, parsePastedText } from '../services/docxParser';
import { downloadDrafterTemplate } from '../services/templateGenerator';
import { getBookChaptersCount } from '../services/kjvService';
import { showToast } from '../utils/toast';

interface DrafterPortalProps {
  currentBook: string;
  currentChapter: number;
  verses: VerseItem[];
  onImportSuccess: (importedVerses: ParsedImportVerse[]) => Promise<void>;
  onNavigateToFocus: () => void;
}

export const DrafterPortal: React.FC<DrafterPortalProps> = ({
  currentBook,
  currentChapter,
  verses,
  onImportSuccess,
  onNavigateToFocus
}) => {
  const [templateChapter, setTemplateChapter] = useState<number>(currentChapter);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedVerses, setParsedVerses] = useState<ParsedImportVerse[] | null>(null);
  const [pasteMode, setPasteMode] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>('');
  const [expandedVerseIdx, setExpandedVerseIdx] = useState<number | null>(0);
  const [importSuccessNotice, setImportSuccessNotice] = useState<string | null>(null);
  const [showColorModal, setShowColorModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const totalChapters = getBookChaptersCount(currentBook);

  // Handle .docx File Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.docx')) {
      setParseError('Please upload a Microsoft Word document (.docx).');
      return;
    }

    try {
      setIsParsing(true);
      setParseError(null);
      setImportSuccessNotice(null);

      const blocks = await extractDocxBlocks(file);
      const results = groupBlocksIntoVerses(blocks, currentBook, verses);

      if (results.length === 0) {
        setParseError('No verse sections found in the document. Ensure sections start with "Verse: Rom 1:1" and include "Proposed Reading:".');
      } else {
        setParsedVerses(results);
      }
    } catch (err) {
      console.error('Docx parse error:', err);
      setParseError('Failed to parse Word document: ' + String(err));
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Pasted Text Parsing
  const handleParsePasted = () => {
    if (!pastedText.trim()) {
      setParseError('Please paste verse text to parse.');
      return;
    }
    setParseError(null);
    setImportSuccessNotice(null);
    const results = parsePastedText(pastedText, currentBook, verses);
    if (results.length === 0) {
      setParseError('No verses could be detected in pasted text.');
    } else {
      setParsedVerses(results);
    }
  };

  // Toggle selection for individual verse
  const toggleSelect = (idx: number) => {
    if (!parsedVerses) return;
    setParsedVerses(
      parsedVerses.map((v, i) => (i === idx ? { ...v, selectedForImport: !v.selectedForImport } : v))
    );
  };

  // Select all / none
  const selectAll = (select: boolean) => {
    if (!parsedVerses) return;
    setParsedVerses(parsedVerses.map((v) => ({ ...v, selectedForImport: select })));
  };

  // Handle Download Template
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadDrafterTemplate(currentBook, templateChapter);
    } catch (err) {
      console.error('Download template error:', err);
      showToast('error', 'Failed to generate template: ' + String(err));
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Execute Import
  const handleExecuteImport = async () => {
    if (!parsedVerses) return;
    const selected = parsedVerses.filter((v) => v.selectedForImport);
    if (selected.length === 0) {
      showToast('warning', 'Please select at least one verse to import.');
      return;
    }

    setIsImporting(true);
    try {
      await onImportSuccess(selected);
      setImportSuccessNotice(`🎉 Successfully imported ${selected.length} verse(s) into ${currentBook}! Drafter confirmation set to 'Y'.`);
      showToast('success', `Imported ${selected.length} verse(s) into ${currentBook}!`);
      setParsedVerses(null);
      setPastedText('');
    } catch (err) {
      console.error('Import error:', err);
      showToast('error', 'Failed to import verses: ' + String(err));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="drafter-portal-container">
      {/* Top Banner */}
      <div className="portal-header">
        <div className="portal-title-group">
          <div className="portal-icon-badge">
            <FileUp size={22} />
          </div>
          <div>
            <h2 className="portal-title">Drafter Translation Studio &amp; Doc Ingestion</h2>
            <p className="portal-subtitle">
              Download chapter-specific Word templates, parse completed translations with character colors, and import directly into Google Sheets.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-color-guide"
          onClick={() => setShowColorModal(true)}
        >
          <Palette size={16} /> Color Rules Guide
        </button>
      </div>

      {importSuccessNotice && (
        <div className="portal-success-banner">
          <div className="banner-msg">
            <CheckCircle2 size={18} />
            <span>{importSuccessNotice}</span>
          </div>
          <button className="btn-jump-focus" onClick={onNavigateToFocus}>
            Open in Focus Mode <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Two Column Section: 1. Template Generator | 2. Word Doc Dropzone */}
      <div className="portal-cards-grid">
        {/* Template Generator Card */}
        <div className="drafter-card">
          <div className="card-top">
            <div className="card-title-row">
              <Download size={20} color="#2563eb" />
              <h3>One-Click Drafter Template Generator</h3>
            </div>
            <span className="badge-tag">DOCX</span>
          </div>
          <p className="card-desc">
            Generates standardized Microsoft Word (.docx) files pre-populated with KJV verses for {currentBook}, required section markers, and 2-row back-translation tables.
          </p>

          <div className="template-controls">
            <div className="control-group">
              <label>Chapter to Generate:</label>
              <select
                className="chapter-select"
                value={templateChapter}
                onChange={(e) => setTemplateChapter(Number(e.target.value))}
              >
                {Array.from({ length: totalChapters }, (_, i) => i + 1).map((ch) => (
                  <option key={ch} value={ch}>
                    {currentBook} Chapter {ch}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-download-template"
              disabled={isDownloading}
              onClick={handleDownload}
            >
              <Download size={16} />
              <span>{isDownloading ? 'Generating...' : `Download ${currentBook} Ch ${templateChapter} Template`}</span>
            </button>
          </div>

          <div className="template-features-list">
            <div className="feature-item">
              <CheckCircle2 size={14} color="#16a34a" />
              <span>Full KJV 1611 English text pre-filled from local canonical engine</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={14} color="#16a34a" />
              <span>Standard 2-row Kannada-English back-translation tables included</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={14} color="#16a34a" />
              <span>Zero Drive setup required — download directly to your computer</span>
            </div>
          </div>
        </div>

        {/* Word Doc Ingestion Dropzone Card */}
        <div className="drafter-card">
          <div className="card-top">
            <div className="card-title-row">
              <FileUp size={20} color="#7c3aed" />
              <h3>Drag-and-Drop Doc Ingestion</h3>
            </div>
            <div className="mode-toggle">
              <button
                className={`toggle-pill ${!pasteMode ? 'active' : ''}`}
                onClick={() => setPasteMode(false)}
              >
                Upload .docx
              </button>
              <button
                className={`toggle-pill ${pasteMode ? 'active' : ''}`}
                onClick={() => setPasteMode(true)}
              >
                Paste Text
              </button>
            </div>
          </div>
          <p className="card-desc">
            Parses drafter Word files, preserves character-level font colors (#FF00FF magenta, #00B050 green), converts Word highlights to bold, and checks sheet conflicts.
          </p>

          {!pasteMode ? (
            <div
              className="file-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const input = fileInputRef.current;
                  if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    handleFileChange({ target: input } as any);
                  }
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <FileUp size={36} color="#94a3b8" />
              <div className="dropzone-text">
                <span className="drop-main">Click to select or drag &amp; drop drafter .docx file</span>
                <span className="drop-sub">Accepts Microsoft Word documents (.docx)</span>
              </div>
              {isParsing && <div className="parsing-indicator">Parsing Word XML &amp; colors…</div>}
            </div>
          ) : (
            <div className="paste-area-box">
              <textarea
                className="paste-textarea"
                rows={4}
                placeholder="Paste drafter document text with 'Verse: Rom 1:1', 'Proposed Reading:', etc..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />
              <button
                type="button"
                className="btn-parse-paste"
                disabled={isParsing || !pastedText.trim()}
                onClick={handleParsePasted}
              >
                Parse Pasted Text
              </button>
            </div>
          )}

          {parseError && (
            <div className="parse-error-banner">
              <AlertTriangle size={16} />
              <span>{parseError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Parsed Verse Conflict & Preview Screen */}
      {parsedVerses && parsedVerses.length > 0 && (
        <div className="parsed-preview-section">
          <div className="preview-header">
            <div className="preview-title-row">
              <Layers size={20} color="var(--theme-text)" />
              <h3>Parsed Translation Preview ({parsedVerses.length} verses extracted)</h3>
            </div>
            <div className="preview-actions">
              <button className="btn-select-all" onClick={() => selectAll(true)}>
                Select All
              </button>
              <button className="btn-select-all" onClick={() => selectAll(false)}>
                Clear
              </button>
              <button
                className="btn-commit-import"
                disabled={isImporting || parsedVerses.filter((v) => v.selectedForImport).length === 0}
                onClick={handleExecuteImport}
              >
                <CheckCircle2 size={16} />
                <span>
                  {isImporting
                    ? 'Importing...'
                    : `Import Selected (${parsedVerses.filter((v) => v.selectedForImport).length}) Verses`}
                </span>
              </button>
            </div>
          </div>

          <div className="parsed-verses-list">
            {parsedVerses.map((pv, idx) => {
              const isExpanded = expandedVerseIdx === idx;
              return (
                <div
                  key={idx}
                  className={`parsed-verse-card ${pv.status} ${pv.selectedForImport ? 'selected' : ''}`}
                >
                  <div className="parsed-card-top">
                    <label className="checkbox-wrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={pv.selectedForImport}
                        onChange={() => toggleSelect(idx)}
                      />
                    </label>

                    <div className="verse-ref-tag" onClick={() => setExpandedVerseIdx(isExpanded ? null : idx)}>
                      <span className="ref-name">{pv.verse}</span>
                      {pv.status === 'ready' && (
                        <span className="status-badge-ready">
                          <CheckCircle2 size={12} /> Ready to Import
                        </span>
                      )}
                      {pv.status === 'conflict' && (
                        <span className="status-badge-conflict">
                          <AlertTriangle size={12} /> Existing Data (Overwrite)
                        </span>
                      )}
                      {pv.status === 'unmatched' && (
                        <span className="status-badge-unmatched">
                          <HelpCircle size={12} /> Ref Not Found in Sheet
                        </span>
                      )}
                    </div>

                    <div className="verse-preview-summary" onClick={() => setExpandedVerseIdx(isExpanded ? null : idx)}>
                      <span className="summary-kannada">{pv.proposed || '(No proposed text)'}</span>
                    </div>

                    <button
                      type="button"
                      className="btn-toggle-expand"
                      onClick={() => setExpandedVerseIdx(isExpanded ? null : idx)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="parsed-card-body">
                      {/* Old Reading */}
                      {pv.oldReading && (
                        <div className="parsed-section">
                          <span className="section-label">OLD READING (KJV)</span>
                          <p className="kjv-preview">{pv.oldReading}</p>
                        </div>
                      )}

                      {/* Proposed Reading with colors */}
                      <div className="parsed-section">
                        <span className="section-label">PARSED PROPOSED KANNADA READING</span>
                        <div
                          className="kannada-preview"
                          dangerouslySetInnerHTML={{ __html: pv.proposedHtml || pv.proposed }}
                        />
                      </div>

                      {/* Word Pairs / Back translation */}
                      {pv.wordPairs && pv.wordPairs.length > 0 && (
                        <div className="parsed-section">
                          <span className="section-label">BACK-TRANSLATION GLOSSES</span>
                          <div className="word-pairs-strip">
                            {pv.wordPairs.map((pair, pIdx) => (
                              <div key={pIdx} className="word-pair-pill">
                                <span className="kannada-term">{pair.kannada}</span>
                                <span className="english-gloss">{pair.english}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Drafter comments */}
                      {pv.drafterCmt && (
                        <div className="parsed-section">
                          <span className="section-label">DRAFTER COMMENTS &amp; NOTES</span>
                          <div
                            className="comments-preview"
                            dangerouslySetInnerHTML={{ __html: pv.drafterCmtHtml || pv.drafterCmt }}
                          />
                        </div>
                      )}

                      {pv.status === 'conflict' && pv.existingProposed && (
                        <div className="conflict-warning-box">
                          <AlertTriangle size={15} color="#b45309" />
                          <div>
                            <strong>Currently in Sheet:</strong> {pv.existingProposed}
                            <div className="conflict-sub">
                              Importing will overwrite the current row values in Columns C, D, and E.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Code Guide Modal */}
      {showColorModal && (
        <div className="modal-backdrop" onClick={() => setShowColorModal(false)}>
          <div className="modal-container color-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Palette size={20} color="#7c3aed" />
                <h3>GLBC Official Color Code &amp; Translation Rules</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowColorModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body color-rules-content">
              <p className="color-rules-intro">
                Official color co-ordination to be used in KJV Kannada translation (from <em>Color_Code_Translation_Rules.pdf</em>):
              </p>

              <div className="color-rule-row">
                <div className="color-swatch" style={{ background: '#fef08a', color: '#854d0e', border: '1px solid #facc15' }}>Yellow</div>
                <div className="color-details">
                  <strong>Yellow — English Words Omitted in Kannada</strong>
                  <p>English words in the KJV that are omitted in the baseline Kannada text are highlighted with yellow.</p>
                </div>
              </div>

              <div className="color-rule-row">
                <div className="color-swatch" style={{ background: '#cffafe', color: '#0e7490', border: '1px solid #22d3ee' }}>Blue / Turquoise</div>
                <div className="color-details">
                  <strong>Blue / Turquoise — Added Words in Kannada</strong>
                  <p>Words added into the Kannada verse for clarity or grammatical construction are highlighted with blue/turquoise.</p>
                </div>
              </div>

              <div className="color-rule-row">
                <div className="color-swatch" style={{ background: '#fce7f3', color: '#be185d', border: '1px solid #f472b6' }}>Pink</div>
                <div className="color-details">
                  <strong>Pink — Corrected Kannada Words</strong>
                  <p>Corrected Kannada words in the proposed translation are highlighted with pink.</p>
                </div>
              </div>

              <div className="color-rule-row">
                <div className="color-swatch" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>Grey</div>
                <div className="color-details">
                  <strong>Grey — Italicized Words</strong>
                  <p>Words italicized in the King James Bible to be highlighted with grey in both Kannada &amp; English.</p>
                </div>
              </div>

              <div className="color-rule-row">
                <div className="color-swatch" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>Green</div>
                <div className="color-details">
                  <strong>Green — Incorrect Kannada Words</strong>
                  <p>Incorrect Kannada words in the baseline text that must be replaced or removed are highlighted with green.</p>
                </div>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--theme-box-bg)', borderRadius: '0.5rem', border: '1px solid var(--theme-border)' }}>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--theme-text)' }}>Translation Procedure (TBS Kannada vs English KJV):</strong>
                <ol style={{ fontSize: '0.75rem', color: 'var(--theme-text-muted)', margin: '0.375rem 0 0 1.25rem', lineHeight: '1.5' }}>
                  <li>Compare TBS Kannada verse with English KJV to identify issues.</li>
                  <li>Define the problem: Added words to remove, missing words to add, incorrect words to change.</li>
                  <li>Set up the translation matrix (2-row Kannada / English phrase table).</li>
                  <li>Provide brief explanation of changes made and rationale.</li>
                </ol>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowColorModal(false)}>
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
