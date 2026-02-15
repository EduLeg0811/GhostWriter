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

  async function getSelectionSnapshot() {
    const selectionType = await exec("GetSelectionType", []);
    const text = await exec("GetSelectedText", [{ Numbering: false, Math: false, NewLineSeparator: "\n" }]);
    return {
      text: typeof text === "string" ? text : "",
      selectionType: typeof selectionType === "string" ? selectionType : "unknown",
      changedAt: Date.now(),
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
