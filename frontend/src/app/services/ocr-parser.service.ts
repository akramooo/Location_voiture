import { Injectable } from '@angular/core';
import { OcrScanResult } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class OcrParserService {

  /**
   * Analyse le texte brut renvoyé par Tesseract OCR et extrait les champs
   * en fonction du type de document sélectionné.
   */
  parseDocument(
    rawText: string,
    docType: 'CIN' | 'PERMIS' | 'PASSEPORT' | 'CARTE_GRISE',
    confidence: number
  ): OcrScanResult {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const result: OcrScanResult = {
      docType,
      rawConfidence: Math.round(confidence * 10) / 10,
      rawText,
      extractedLines: lines
    };

    switch (docType) {
      case 'CIN':
        this.parseCin(lines, rawText, result);
        break;
      case 'PERMIS':
        this.parsePermis(lines, rawText, result);
        break;
      case 'PASSEPORT':
        this.parsePasseport(lines, rawText, result);
        break;
      case 'CARTE_GRISE':
        this.parseCarteGrise(lines, rawText, result);
        break;
    }

    return result;
  }

  // ==========================================
  // PARSEUR CARTE D'IDENTITÉ NATIONALE (CIN)
  // ==========================================
  private parseCin(lines: string[], rawText: string, result: OcrScanResult): void {
    result.nationality = 'Marocaine';

    // 1. Détection Zone MRZ (Verso CIN OACI)
    const mrzLines = lines.filter(l => l.startsWith('I<MAR') || l.startsWith('IDMAR') || l.includes('<<'));
    if (mrzLines.length >= 1) {
      this.parseMrzCin(mrzLines, result);
    }

    // 2. Détection Numéro CIN (Ex: AB123456, BE998877, BK765432, D123456)
    if (!result.cinPassport) {
      // Regex CIN Maroc : 1 ou 2 lettres majuscules suivies de 4 à 7 chiffres
      const cinRegex = /\b([A-Z]{1,2})\s*([0-9]{4,7})\b/i;
      
      // Chercher d'abord sur les lignes contenant "CIN", "N°", "CARTE", "ROYAUME"
      for (const line of lines) {
        const cleaned = line.replace(/[\.:;\-_]/g, ' ').toUpperCase();
        const match = cleaned.match(cinRegex);
        if (match) {
          const formattedCin = (match[1] + match[2]).toUpperCase();
          // Éviter les faux positifs (comme les années 1999, 2024, etc.)
          if (!/^(19|20)\d{2}$/.test(match[2])) {
            result.cinPassport = formattedCin;
            break;
          }
        }
      }

      // Si pas trouvé, balayer tout le texte brut
      if (!result.cinPassport) {
        const fullMatch = rawText.match(/\b([A-Z]{1,2})[ -]?([0-9]{4,7})\b/);
        if (fullMatch) {
          result.cinPassport = (fullMatch[1] + fullMatch[2]).toUpperCase();
        }
      }
    }

    // 3. Détection Date d'expiration & Date de naissance
    const dates = this.extractDates(rawText);
    if (dates.length > 0) {
      // Trier les dates : la plus récente dans le futur est généralement l'expiration
      const today = new Date().toISOString().split('T')[0];
      const futureDates = dates.filter(d => d >= today);
      const pastDates = dates.filter(d => d < today);

      if (futureDates.length > 0) {
        result.expiryDate = futureDates[0];
      } else if (dates.length >= 1) {
        result.expiryDate = dates[dates.length - 1];
      }

      if (pastDates.length > 0) {
        result.birthDate = pastDates[0];
      }
    }

    // 4. Détection Nom et Prénom
    this.extractNameFromLabels(lines, result);
  }

  // ==========================================
  // PARSEUR PERMIS DE CONDUIRE MAROCAIN
  // ==========================================
  private parsePermis(lines: string[], rawText: string, result: OcrScanResult): void {
    // 1. Détection Numéro de Permis (Format Maroc : NN/NNNNNN ex: 05/123456 ou 44/987654)
    const permisRegex = /\b([0-9]{2})\s*[\/\-]\s*([0-9]{4,8})\b/;
    for (const line of lines) {
      const match = line.match(permisRegex);
      if (match) {
        result.driverLicenseNumber = `${match[1]}/${match[2]}`;
        break;
      }
    }

    // 2. Détection éventuelle du CIN associé mentionné sur le permis
    const cinMatch = rawText.match(/\b([A-Z]{1,2})\s*([0-9]{4,7})\b/i);
    if (cinMatch) {
      result.cinPassport = (cinMatch[1] + cinMatch[2]).toUpperCase();
    }

    // 3. Détection Dates
    const dates = this.extractDates(rawText);
    const today = new Date().toISOString().split('T')[0];
    const futureDates = dates.filter(d => d >= today);
    if (futureDates.length > 0) {
      result.expiryDate = futureDates[0];
    } else if (dates.length > 0) {
      result.expiryDate = dates[dates.length - 1];
    }

    // 4. Noms
    this.extractNameFromLabels(lines, result);
  }

  // ==========================================
  // PARSEUR PASSEPORT INTERNATIONAL
  // ==========================================
  private parsePasseport(lines: string[], rawText: string, result: OcrScanResult): void {
    // 1. Détection MRZ Passeport (Format P<MAR... ou P<FRA...)
    const passportMrz = lines.find(l => l.startsWith('P<') || l.startsWith('P('));
    if (passportMrz) {
      const mrzClean = passportMrz.replace(/[\(\)]/g, '<');
      const parts = mrzClean.split('<<');
      if (parts.length >= 2) {
        const surnamePart = parts[0].replace(/^P<[A-Z]{3}/, '').replace(/</g, ' ').trim();
        const givenNamePart = parts[1].replace(/</g, ' ').trim();
        if (surnamePart) result.lastName = this.capitalizeWords(surnamePart);
        if (givenNamePart) result.firstName = this.capitalizeWords(givenNamePart);
      }
    }

    // 2. Détection N° Passeport (1 ou 2 lettres + 7 chiffres)
    const passRegex = /\b([A-Z]{1,2}[0-9]{6,8})\b/;
    for (const line of lines) {
      const match = line.match(passRegex);
      if (match && !result.cinPassport) {
        result.cinPassport = match[1].toUpperCase();
        break;
      }
    }

    // 3. Dates
    const dates = this.extractDates(rawText);
    if (dates.length > 0) {
      result.expiryDate = dates[dates.length - 1];
    }

    if (!result.lastName) {
      this.extractNameFromLabels(lines, result);
    }
  }

  // ==========================================
  // PARSEUR CARTE GRISE VÉHICULE
  // ==========================================
  private parseCarteGrise(lines: string[], rawText: string, result: OcrScanResult): void {
    // 1. Détection Immatriculation Marocaine (ex: 12345-A-6, 7890-B-26, 45678|د|33)
    // Format : 1 à 5 chiffres - Lettre (Française ou Arabe) - 1 à 2 chiffres
    const plateRegex = /\b([0-9]{1,5})\s*[\-\|\/\s]\s*([A-Za-z\u0600-\u06FF]|[A-Z]{1,2})\s*[\-\|\/\s]\s*([0-9]{1,2})\b/;
    for (const line of lines) {
      const match = line.match(plateRegex);
      if (match) {
        result.licensePlate = `${match[1]}-${match[2].toUpperCase()}-${match[3]}`;
        result.cinPassport = result.licensePlate; // Rétro-compatibilité affichage
        break;
      }
    }

    // 2. Détection Numéro de Châssis (VIN - 17 caractères alphanumériques sans I, O, Q)
    const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
    const vinMatch = rawText.match(vinRegex);
    if (vinMatch) {
      result.vinNumber = vinMatch[1].toUpperCase();
    }

    // 3. Détection Marque / Modèle courante au Maroc
    const knownBrands = [
      'DACIA', 'RENAULT', 'PEUGEOT', 'VOLKSWAGEN', 'HYUNDAI', 'KIA',
      'TOYOTA', 'MERCEDES', 'BMW', 'AUDI', 'FIAT', 'CITROEN', 'NISSAN',
      'FORD', 'SEAT', 'SKODA', 'JEEP', 'LAND ROVER', 'PORSCHE', 'OPEL'
    ];
    for (const line of lines) {
      const upper = line.toUpperCase();
      for (const brand of knownBrands) {
        if (upper.includes(brand)) {
          result.brandModel = upper;
          result.firstName = brand; // Rétro-compatibilité affichage
          break;
        }
      }
      if (result.brandModel) break;
    }

    // 4. Dates
    const dates = this.extractDates(rawText);
    if (dates.length > 0) {
      result.expiryDate = dates[0];
    }
  }

  // ==========================================
  // UTILITAIRES D'EXTRACTION DE MOTIFS
  // ==========================================

  /**
   * Extrait toutes les dates reconnues dans le texte brut et les normalise en YYYY-MM-DD
   */
  private extractDates(text: string): string[] {
    const dates: string[] = [];

    // Format DD/MM/YYYY ou DD.MM.YYYY ou DD-MM-YYYY
    const dmyRegex = /\b([0-3]?[0-9])[\.\/\-]([0-1]?[0-9])[\.\/\-](19\d{2}|20\d{2})\b/g;
    let match: RegExpExecArray | null;
    while ((match = dmyRegex.exec(text)) !== null) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        dates.push(`${year}-${month}-${day}`);
      }
    }

    // Format YYYY-MM-DD
    const ymdRegex = /\b(19\d{2}|20\d{2})[\.\/\-]([0-1]?[0-9])[\.\/\-]([0-3]?[0-9])\b/g;
    while ((match = ymdRegex.exec(text)) !== null) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        dates.push(`${year}-${month}-${day}`);
      }
    }

    return [...new Set(dates)].sort();
  }

  /**
   * Recherche de Nom et Prénom basée sur les mots-clés usuels (Nom, Prénom, etc.)
   */
  private extractNameFromLabels(lines: string[], result: OcrScanResult): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const upper = line.toUpperCase();

      // Détection Nom
      if (/NOM\b|SURNAME\b/i.test(upper) && !/PRENOM|PRÉNOM/i.test(upper) && !result.lastName) {
        const val = line.replace(/NOM|SURNAME|[\.:;\-_]/gi, '').trim();
        if (val.length > 1) {
          result.lastName = this.capitalizeWords(val);
        } else if (i + 1 < lines.length && lines[i + 1].length > 1 && !lines[i + 1].includes(':')) {
          result.lastName = this.capitalizeWords(lines[i + 1]);
        }
      }

      // Détection Prénom
      if (/PRENOM|PRÉNOM|GIVEN/i.test(upper) && !result.firstName) {
        const val = line.replace(/PRENOM|PRÉNOM|GIVEN|NAME|[\.:;\-_]/gi, '').trim();
        if (val.length > 1) {
          result.firstName = this.capitalizeWords(val);
        } else if (i + 1 < lines.length && lines[i + 1].length > 1 && !lines[i + 1].includes(':')) {
          result.firstName = this.capitalizeWords(lines[i + 1]);
        }
      }
    }

    // Heuristique de secours si pas de labels : chercher des lignes avec 2 mots en majuscules (hors en-têtes)
    if (!result.lastName || !result.firstName) {
      const ignoreWords = ['ROYAUME', 'MAROC', 'CARTE', 'NATIONALE', 'IDENTITE', 'PERMIS', 'CONDUIRE', 'MINISTERE', 'DIRECTION'];
      for (const line of lines) {
        const cleanWords = line.split(/\s+/).filter(w => w.length > 2 && /^[A-Za-zÀ-ÿ]+$/.test(w));
        const filtered = cleanWords.filter(w => !ignoreWords.includes(w.toUpperCase()));
        if (filtered.length >= 2 && !result.lastName && !result.firstName) {
          result.lastName = this.capitalizeWords(filtered[0]);
          result.firstName = this.capitalizeWords(filtered.slice(1).join(' '));
          break;
        }
      }
    }
  }

  /**
   * Parse les lignes MRZ pour les CINs marocaines (au verso)
   */
  private parseMrzCin(mrzLines: string[], result: OcrScanResult): void {
    const fullMrz = mrzLines.join(' ');
    // Ex: I<MARBE998877<<<<<<<<<<<<<<<
    // 9505144M3005146MAR<<<<<<<<<<<8
    // EL<FASSI<<MOHAMMED<<<<<<<<<<<<
    const nameMatch = fullMrz.match(/([A-Z]+)<<([A-Z]+)/);
    if (nameMatch) {
      result.lastName = this.capitalizeWords(nameMatch[1]);
      result.firstName = this.capitalizeWords(nameMatch[2]);
    }

    const cinMatch = fullMrz.match(/I<MAR([A-Z0-9]{6,9})/);
    if (cinMatch) {
      result.cinPassport = cinMatch[1].replace(/</g, '').trim();
    }
  }

  private capitalizeWords(str: string): string {
    return str
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  }
}
