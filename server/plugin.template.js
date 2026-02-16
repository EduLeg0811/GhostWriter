(function () {
  const SOURCE = "parapreceptor-onlyoffice-plugin";
  const APP_SOURCE = "parapreceptor-app";
  let pollTimer = null;
  let lastText = "";
  let lastSelectionType = "";

  function send(type, payload) {
    window.top.postMessage({ source: SOURCE, type: type, payload: payload || {} }, "*");
  }

  function callCommand(fn) {
    return new Promise(function (resolve, reject) {
      try {
        Asc.plugin.callCommand(fn, false, true, function (result) {
          resolve(result);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async function getCurrentCursorTextStyle() {
    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        let fontFamily = "";
        let fontSize = 0;

        const run = doc.GetCurrentRun ? doc.GetCurrentRun() : null;
        if (run && run.GetTextPr) {
          const textPr = run.GetTextPr();
          if (textPr && textPr.GetFontFamily) fontFamily = String(textPr.GetFontFamily() || "");
          if (textPr && textPr.GetFontSize) fontSize = Number(textPr.GetFontSize() || 0);
        }

        if (!fontFamily && doc.GetDefaultTextPr) {
          const defaultTextPr = doc.GetDefaultTextPr();
          if (defaultTextPr && defaultTextPr.GetFontFamily) {
            fontFamily = String(defaultTextPr.GetFontFamily() || "");
          }
          if (!fontSize && defaultTextPr && defaultTextPr.GetFontSize) {
            fontSize = Number(defaultTextPr.GetFontSize() || 0);
          }
        }

        return { fontFamily: fontFamily, fontSize: fontSize };
      } catch (_err) {
        return { fontFamily: "", fontSize: 0 };
      }
    });

    return {
      fontFamily: String((result || {}).fontFamily || "").trim(),
      fontSize: Number((result || {}).fontSize || 0),
    };
  }

  function buildInheritedHtml(payload, style) {
    const rawHtml = String((payload || {}).html || "").trim();
    if (!rawHtml) return "";

    const css = [];
    if (style && style.fontFamily) {
      const safeFont = style.fontFamily.replace(/"/g, "&quot;");
      css.push('font-family:"' + safeFont + '"');
    }
    if (style && style.fontSize > 0) {
      css.push("font-size:" + style.fontSize + "pt");
    }
    css.push("color:inherit");

    // Mantem negrito/italico/headers do HTML recebido.
    return (
      "<div style=\"" + css.join(";") + ";\">" +
      rawHtml +
      "</div>"
    );
  }

  function exec(name, args) {
    return new Promise(function (resolve) {
      Asc.plugin.executeMethod(name, args || [], function (result) {
        resolve(result);
      });
    });
  }

  function parseTermsFromInput(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];
    const pieces = raw.split(/[\s,;|]+/g).map(function (item) { return item.trim(); }).filter(Boolean);
    const unique = [];
    const seen = Object.create(null);
    for (let i = 0; i < pieces.length; i += 1) {
      const key = pieces[i].toLocaleLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      unique.push(pieces[i]);
    }
    return unique;
  }

  async function highlightTermsAcrossDocument(payload) {
    const terms = parseTermsFromInput((payload || {}).text);
    if (terms.length === 0) throw new Error("Informe ao menos 1 termo no campo Texto de entrada.");
    Asc.scope.highlightTerms = terms;
    Asc.scope.highlightColor = String((payload || {}).color || "").trim().toLowerCase() || "yellow";

    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        const terms = (Asc.scope && Asc.scope.highlightTerms) || [];
        const selectedColor = (Asc.scope && Asc.scope.highlightColor) || "yellow";
        const run = doc.GetCurrentRun ? doc.GetCurrentRun() : null;
        const textPr = run && run.GetTextPr ? run.GetTextPr() : null;
        let highlightColor = String(selectedColor || "yellow");

        if (!selectedColor && textPr && textPr.GetHighlight) {
          const current = String(textPr.GetHighlight() || "").trim();
          if (current) highlightColor = current;
        }

        let matches = 0;
        let highlighted = 0;

        for (let i = 0; i < terms.length; i += 1) {
          const term = terms[i];
          if (!term) continue;
          const ranges = doc.Search(term, false) || [];
          matches += ranges.length;
          for (let j = 0; j < ranges.length; j += 1) {
            const range = ranges[j];
            try {
              if (range && range.SetHighlight) {
                range.SetHighlight(highlightColor);
                highlighted += 1;
                continue;
              }
              if (range && range.SetTextPr && Api.CreateTextPr) {
                const pr = Api.CreateTextPr();
                if (pr && pr.SetHighlight) {
                  pr.SetHighlight(highlightColor);
                  range.SetTextPr(pr);
                  highlighted += 1;
                }
              }
            } catch (_innerErr) {
              // ignore range-level failures and continue
            }
          }
        }

        return { ok: true, terms: terms.length, matches: matches, highlighted: highlighted, color: highlightColor };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Falha ao executar Macro1." };
      }
    });

    if (!result || result.ok !== true) {
      throw new Error((result && result.error) || "Falha ao executar Macro1.");
    }

    return result;
  }

  async function clearTermsHighlightAcrossDocument(payload) {
    const terms = parseTermsFromInput((payload || {}).text);
    if (terms.length === 0) throw new Error("Informe ao menos 1 termo no campo Texto de entrada.");
    Asc.scope.highlightTerms = terms;

    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        const terms = (Asc.scope && Asc.scope.highlightTerms) || [];
        let matches = 0;
        let cleared = 0;

        for (let i = 0; i < terms.length; i += 1) {
          const term = terms[i];
          if (!term) continue;
          const ranges = doc.Search(term, false) || [];
          matches += ranges.length;
          for (let j = 0; j < ranges.length; j += 1) {
            const range = ranges[j];
            try {
              if (range && range.SetHighlight) {
                range.SetHighlight("none");
                cleared += 1;
                continue;
              }
              if (range && range.SetTextPr && Api.CreateTextPr) {
                const pr = Api.CreateTextPr();
                if (pr && pr.SetHighlight) {
                  pr.SetHighlight("none");
                  range.SetTextPr(pr);
                  cleared += 1;
                }
              }
            } catch (_innerErr) {
              // ignore range-level failures and continue
            }
          }
        }

        return { ok: true, terms: terms.length, matches: matches, cleared: cleared };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Falha ao limpar marcacoes da Macro1." };
      }
    });

    if (!result || result.ok !== true) {
      throw new Error((result && result.error) || "Falha ao limpar marcacoes da Macro1.");
    }

    return result;
  }

  async function macro2ManualNumberingSelection(payload) {
    Asc.scope.macro2SpacingMode = String((payload || {}).spacingMode || "nbsp_double");

    // Aplica apenas numeracao manual por paragrafo selecionado.
    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        if (!doc) return { ok: false, error: "Documento indisponivel." };

        let paragraphs = [];
        if (doc.GetRangeBySelect) {
          const selectedRange = doc.GetRangeBySelect();
          if (selectedRange && selectedRange.GetAllParagraphs) {
            paragraphs = selectedRange.GetAllParagraphs() || [];
          }
        }
        if ((!paragraphs || paragraphs.length === 0) && doc.GetSelectedParagraphs) {
          paragraphs = doc.GetSelectedParagraphs() || [];
        }
        if ((!paragraphs || paragraphs.length === 0) && doc.GetCurrentParagraph) {
          const current = doc.GetCurrentParagraph();
          if (current) paragraphs = [current];
        }

        if (!paragraphs || paragraphs.length === 0) {
          return { ok: false, error: "Selecione uma lista numerada no documento." };
        }

        let converted = 0;
        let hadNumbering = 0;
        const totalSelected = paragraphs.length;
        const useLeadingZero = totalSelected > 9;
        const spacingMode = String((Asc.scope && Asc.scope.macro2SpacingMode) || "nbsp_double");
        const spaceUnit = spacingMode.startsWith("nbsp") ? "\u00A0" : " ";
        const spaceCount = spacingMode.endsWith("double") ? 2 : 1;
        const suffix = spaceUnit.repeat(spaceCount);

        for (let i = 0; i < paragraphs.length; i += 1) {
          const paragraph = paragraphs[i];
          if (!paragraph || !paragraph.GetText) continue;

          let isNumbered = false;
          try {
            if (paragraph.IsNumberedList && paragraph.IsNumberedList()) isNumbered = true;
            if (!isNumbered && paragraph.GetNumbering && paragraph.GetNumbering()) isNumbered = true;
            if (!isNumbered && paragraph.GetNumPr && paragraph.GetNumPr()) isNumbered = true;
          } catch (_err) {
            // ignore detection errors
          }

          if (isNumbered) hadNumbering += 1;

          // prefixo manual no inicio do paragrafo sem reconstruir runs
          try {
            const n = i + 1;
            const prefixNumber = useLeadingZero ? String(n).padStart(2, "0") : String(n);
            const prefix = prefixNumber + "." + suffix;
            if (paragraph.GetRange) {
              const startRange = paragraph.GetRange(0, 0);
              if (startRange && startRange.AddText) {
                startRange.AddText(prefix);
                converted += 1;
                continue;
              }
            }
            if (paragraph.MoveCursorToStartPos) paragraph.MoveCursorToStartPos();
            if (paragraph.AddText) { // fallback
              paragraph.AddText(prefix);
              converted += 1;
            }
          } catch (_err) {
            // ignore paragraph-level error
          }
        }

        if (converted <= 0) return { ok: false, error: "Nao foi possivel converter a selecao em lista manual." };
        return { ok: true, converted: converted, hadNumbering: hadNumbering };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Falha ao executar Macro2." };
      }
    });

    if (!result || result.ok !== true) {
      throw new Error((result && result.error) || "Falha ao executar Macro2.");
    }
    return result;
  }

  async function macro2ManualNumberingPreviewSelection() {
    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        if (!doc) return { ok: false, error: "Documento indisponivel." };

        let paragraphs = [];
        if (doc.GetRangeBySelect) {
          const selectedRange = doc.GetRangeBySelect();
          if (selectedRange && selectedRange.GetAllParagraphs) {
            paragraphs = selectedRange.GetAllParagraphs() || [];
          }
        }
        if ((!paragraphs || paragraphs.length === 0) && doc.GetSelectedParagraphs) {
          paragraphs = doc.GetSelectedParagraphs() || [];
        }
        if ((!paragraphs || paragraphs.length === 0) && doc.GetCurrentParagraph) {
          const current = doc.GetCurrentParagraph();
          if (current) paragraphs = [current];
        }

        if (!paragraphs || paragraphs.length === 0) {
          return { ok: false, error: "Selecione uma lista numerada no documento." };
        }

        const wouldConvert = paragraphs.length;
        let hadNumbering = 0;
        for (let i = 0; i < paragraphs.length; i += 1) {
          const paragraph = paragraphs[i];
          if (!paragraph || !paragraph.GetText) continue;

          let isNumbered = false;
          try {
            if (paragraph.IsNumberedList && paragraph.IsNumberedList()) isNumbered = true;
            if (!isNumbered && paragraph.GetNumbering && paragraph.GetNumbering()) isNumbered = true;
            if (!isNumbered && paragraph.GetNumPr && paragraph.GetNumPr()) isNumbered = true;
          } catch (_err) {
            // ignore
          }

          if (isNumbered) hadNumbering += 1;
        }

        return { ok: true, wouldConvert: wouldConvert, hadNumbering: hadNumbering };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Falha ao executar preview da Macro2." };
      }
    });

    if (!result || result.ok !== true) {
      throw new Error((result && result.error) || "Falha ao executar preview da Macro2.");
    }
    return result;
  }

  async function getSelectionSnapshot() {
    const selectionType = await exec("GetSelectionType", []);
    const text = await exec("GetSelectedText", [{ Numbering: false, Math: false, NewLineSeparator: "\n" }]);
    return {
      text: typeof text === "string" ? text : "",
      selectionType: typeof selectionType === "string" ? selectionType : "unknown",
      changedAt: Date.now(),
    };
  }

  
  async function getDocumentPageCount() {
    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        if (!doc || !doc.GetPageCount) return { ok: false, error: "Metodo GetPageCount indisponivel." };
        const pageCount = Number(doc.GetPageCount() || 0);
        return { ok: true, pageCount: pageCount > 0 ? pageCount : 0 };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Falha ao obter paginas do documento." };
      }
    });

    if (!result || result.ok !== true) {
      throw new Error((result && result.error) || "Falha ao obter paginas do documento.");
    }
    return result.pageCount;
  }

  async function getDocumentStats() {
    const result = await callCommand(function () {
      try {
        const doc = Api.GetDocument();
        if (!doc) return { ok: false, error: "Documento indisponivel." };

        let paragraphs = 0;
        let words = 0;
        let pages = 0;
        let symbols = 0;
        let symbolsWithSpaces = 0;

        if (doc.GetPageCount) {
          pages = Number(doc.GetPageCount() || 0);
        }

        if (doc.GetStatistics) {
          const stats = doc.GetStatistics() || {};
          words = Number(
            stats.Words
            || stats.WordCount
            || stats.WordsCount
            || stats.wordCount
            || 0,
          );
          paragraphs = Number(
            stats.Paragraphs
            || stats.ParagraphCount
            || stats.ParagraphsCount
            || stats.paragraphCount
            || 0,
          );
          symbols = Number(
            stats.Symbols
            || stats.SymbolCount
            || stats.SymbolsCount
            || stats.symbolCount
            || 0,
          );
          symbolsWithSpaces = Number(
            stats.SymbolsWithSpaces
            || stats.SymbolsWOSpaces
            || stats.SymbolsWS
            || stats.SymbolsWithSpacesCount
            || stats.SymbolCountWithSpaces
            || stats.symbolsWithSpaces
            || 0,
          );
        }

        if (doc.GetAllParagraphs) {
          const all = doc.GetAllParagraphs() || [];
          let fallbackSymbols = 0;
          let fallbackSymbolsWithSpaces = 0;
          let fallbackWords = 0;
          let fallbackParagraphs = 0;
          for (let i = 0; i < all.length; i += 1) {
            const paragraph = all[i];
            if (!paragraph || !paragraph.GetText) continue;
            const text = String(paragraph.GetText() || "").trim();
            if (!text) continue;
            fallbackParagraphs += 1;
            fallbackWords += text.split(/\s+/).filter(Boolean).length;
            fallbackSymbolsWithSpaces += text.length;
            fallbackSymbols += text.replace(/\s+/g, "").length;
          }
          if (paragraphs <= 0) paragraphs = fallbackParagraphs;
          if (words <= 0) words = fallbackWords;
          if (symbols <= 0) symbols = fallbackSymbols;
          if (symbolsWithSpaces <= 0) symbolsWithSpaces = fallbackSymbolsWithSpaces;
          return {
            ok: true,
            pages: pages > 0 ? pages : 0,
            paragraphs: paragraphs > 0 ? paragraphs : 0,
            words: words > 0 ? words : 0,
            symbols: symbols > 0 ? symbols : 0,
            symbolsWithSpaces: symbolsWithSpaces > 0 ? symbolsWithSpaces : 0,
          }
        }

        if (doc.GetText) {
          const text = String(doc.GetText() || "").trim();
          if (text) {
            if (paragraphs <= 0) {
              paragraphs = text.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean).length;
            }
            if (words <= 0) {
              words = text.split(/\s+/).filter(Boolean).length;
            }
            if (symbols <= 0) {
              symbols = text.replace(/\s+/g, "").length;
            }
            if (symbolsWithSpaces <= 0) {
              symbolsWithSpaces = text.length;
            }
          }
        }

        return {
          ok: true,
          pages: pages > 0 ? pages : 0,
          paragraphs: paragraphs > 0 ? paragraphs : 0,
          words: words > 0 ? words : 0,
          symbols: symbols > 0 ? symbols : 0,
          symbolsWithSpaces: symbolsWithSpaces > 0 ? symbolsWithSpaces : 0,
        };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Falha ao obter estatisticas do documento." };
      }
    });

    if (!result || result.ok !== true) {
      throw new Error((result && result.error) || "Falha ao obter estatisticas do documento.");
    }
    return {
      pages: Number(result.pages || 0),
      paragraphs: Number(result.paragraphs || 0),
      words: Number(result.words || 0),
      symbols: Number(result.symbols || 0),
      symbolsWithSpaces: Number(result.symbolsWithSpaces || 0),
    };
  }
  async function emitSelectionIfChanged(force) {
    try {
      const snapshot = await getSelectionSnapshot();
      const changed = force || snapshot.text !== lastText || snapshot.selectionType !== lastSelectionType;
      if (!changed) return;
      lastText = snapshot.text;
      lastSelectionType = snapshot.selectionType;
      send("selectionChanged", snapshot);
    } catch (_err) {
      // ignore read errors during editor transitions
    }
  }

  async function handleCommand(command, payload) {
    switch (command) {
      case "getSelectedText":
        return await exec("GetSelectedText", [{ Numbering: false, Math: false, NewLineSeparator: "\n" }]);
      case "selectAllContent":
        await exec("SelectAll", []);
        await emitSelectionIfChanged(true);
        return { ok: true };
      case "replaceSelection":
        try {
          const style = await getCurrentCursorTextStyle();
          const html = buildInheritedHtml(payload, style);
          if (html) {
            await exec("PasteHtml", [html]);
          } else {
            await exec("PasteText", [String((payload || {}).text || "")]);
          }
        } catch (_err) {
          // Fallback para texto puro.
          await exec("PasteText", [String((payload || {}).text || "")]);
        }
        await emitSelectionIfChanged(true);
        return { ok: true };
      case "refreshSelection":
        await emitSelectionIfChanged(true);
        return { ok: true };
      case "getDocumentPageCount":
        return await getDocumentPageCount();
      case "getDocumentStats":
        return await getDocumentStats();
      case "macro1HighlightDocument":
        return await highlightTermsAcrossDocument(payload);
      case "macro1ClearHighlightDocument":
        return await clearTermsHighlightAcrossDocument(payload);
      case "macro2ManualNumberingSelection":
        return await macro2ManualNumberingSelection();
      case "macro2ManualNumberingPreviewSelection":
        return await macro2ManualNumberingPreviewSelection();
      default:
        throw new Error("Comando nao suportado: " + command);
    }
  }

  window.addEventListener("message", async function (event) {
    const data = event.data || {};
    if (data.source !== APP_SOURCE || data.type !== "command") return;
    const id = data.id;
    try {
      const result = await handleCommand(data.command, data.payload || {});
      send("response", { id: id, result: result });
    } catch (err) {
      send("error", { id: id, message: err && err.message ? err.message : "Erro no plugin." });
    }
  });

  Asc.plugin.init = function () {
    send("ready", {});
    emitSelectionIfChanged(true);
    pollTimer = window.setInterval(function () {
      emitSelectionIfChanged(false);
    }, 300);
  };

  Asc.plugin.onExternalMouseUp = function () {
    emitSelectionIfChanged(false);
  };

  Asc.plugin.button = function () {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
})();
