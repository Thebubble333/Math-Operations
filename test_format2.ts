
const formatTerms = (terms: string[], forCancel: boolean) => {
      let res = [];
      let joined = "";
      for (let i = 0; i < terms.length; i++) {
          let t = terms[i];
          let displayT = t;
          if (i > 0) {
              let prev = terms[i-1];
              let needsTimes = false;
              if (/^[+\-]/.test(t)) needsTimes = true;
              if (/[0-9]$/.test(prev) && /^[0-9]/.test(t)) needsTimes = true;
              if (/[a-zA-Z]$/.test(prev) && /^[0-9]/.test(t)) needsTimes = true;
              if (prev.endsWith(')') && /^[0-9a-zA-Z]/.test(t)) needsTimes = true;
              if (needsTimes) {
                  if (forCancel) res.push(`\\times `);
                  else joined += `\\times `;
                  if (displayT.startsWith('+')) displayT = displayT.substring(1);
                  else if (displayT.startsWith('-')) displayT = `(${displayT})`;
              }
          }
          if (forCancel) res.push(`\\term{${displayT}}`);
          else joined += displayT;
      }
      return forCancel ? res.join('') : joined;
  };
console.log(formatTerms(["x", "2"], false));
console.log(formatTerms(["3", "2"], false));
