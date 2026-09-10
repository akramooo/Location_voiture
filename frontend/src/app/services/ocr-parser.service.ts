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
    const mrzLines = lines.filter(l => l.startsWith('I<MAR') || l.startsWith('IDMAR') || l.includes('<<') || l.includes('I<'));
    if (mrzLines.length >= 1) {
      this.parseMrzCin(mrzLines, result);
    }

    // 2. Détection Numéro CIN (Ex: AB123456, BE998877, BK765432, D123456, EE12345)
    if (!result.cinPassport) {
      // Regex CIN Maroc : 1 ou 2 lettres majuscules suivies de 3 à 7 chiffres
      // Supporte les espaces, points ou tirets intercalés par l'OCR
      const cinRegex = /\b([A-Z]{1,2})\s*[\.\-_]?\s*([0-9OIlS]{3,7})\b/i;
      
      // Chercher d'abord sur les lignes
      for (const line of lines) {
        // Ignorer les mots-clés comme MAROC, CARTE, etc.
        const cleaned = line.replace(/ROYAUME|MAROC|CARTE|NATIONALE|IDENTITE/gi, '').trim();
        const match = cleaned.match(cinRegex);
        if (match) {
          const prefix = match[1].toUpperCase();
          // Correction des erreurs fréquentes OCR dans les chiffres (O->0, I/l->1, S->5)
          const digits = match[2]
            .replace(/[Oo]/g, '0')
            .replace(/[Il|]/g, '1')
            .replace(/[Ss]/g, '5');

          if (/^\d{3,7}$/.test(digits) && !/^(19|20)\d{2}$/.test(digits)) {
            result.cinPassport = `${prefix}${digits}`;
            break;
          }
        }
      }

      // Si pas encore trouvé, scanner l'ensemble du texte brut
      if (!result.cinPassport) {
        const matches = rawText.matchAll(/\b([A-Z]{1,2})[\s\.\-_]?([0-9OIlS]{3,7})\b/gi);
        for (const m of matches) {
          const prefix = m[1].toUpperCase();
          const digits = m[2]
            .replace(/[Oo]/g, '0')
            .replace(/[Il|]/g, '1')
            .replace(/[Ss]/g, '5');
          if (/^\d{3,7}$/.test(digits) && !/^(19|20)\d{2}$/.test(digits)) {
            result.cinPassport = `${prefix}${digits}`;
            break;
          }
        }
      }
    }

    // 3. Détection Date d'expiration & Date de naissance
    // Détection spécifique pour "VALABLE JUSQU'AU" ou "VALABLE AU"
    const expiryMatch = rawText.match(/VALABLE\s+(?:JUSQU\s*[\'’]?\s*AU|AU)?\s*[:\.]?\s*([0-3]?[0-9][\.\/\-][0-1]?[0-9][\.\/\-](?:19|20)\d{2})/i);
    if (expiryMatch) {
      result.expiryDate = this.normalizeDate(expiryMatch[1]);
    }

    // Détection spécifique pour "NÉ LE" ou "NE LE"
    const birthMatch = rawText.match(/N[ÉE]\s*(?:LE)?\s*[:\.]?\s*([0-3]?[0-9][\.\/\-][0-1]?[0-9][\.\/\-](?:19|20)\d{2})/i);
    if (birthMatch) {
      result.birthDate = this.normalizeDate(birthMatch[1]);
    }

    // Fallback extraction de toutes les dates
    const dates = this.extractDates(rawText);
    if (dates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const futureDates = dates.filter(d => d >= today);
      const pastDates = dates.filter(d => d < today);

      if (!result.expiryDate) {
        if (futureDates.length > 0) {
          result.expiryDate = futureDates[0];
        } else if (dates.length >= 1) {
          result.expiryDate = dates[dates.length - 1];
        }
      }

      if (!result.birthDate && pastDates.length > 0) {
        result.birthDate = pastDates[0];
      }
    }

    // 4. Détection Nom et Prénom spécialisée CIN Maroc
    this.extractCinNames(lines, rawText, result);
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
  // EXTRACTION DYNAMIQUE DES NOMS (100% DIRECTEMENT DE LA CARTE)
  // ==========================================
  private extractCinNames(lines: string[], rawText: string, result: OcrScanResult): void {
    if (result.firstName && result.lastName) return;

    // Mots officiels imprimés sur toutes les cartes et bruits OCR à ignorer
    const IGNORED_TERMS = new Set([
      'ROYAUME', 'DU', 'MAROC', 'CARTE', 'NATIONALE', 'IDENTITE', 'DIDENTITE', 'D\'IDENTITE',
      'PERMIS', 'DE', 'CONDUIRE', 'MINISTERE', 'DIRECTION', 'GENERALE', 'SURETE',
      'VALABLE', 'JUSQU', 'JUSQUAU', 'JUSQU\'AU', 'AU', 'EXPIRATION', 'NE', 'NÉ', 'LE',
      'NEE', 'NÉE', 'A', 'À', 'AU', 'AUX', 'DES', 'ET', 'FILS', 'FILLE', 'CAN', 'CNIE', 'CIN',
      'SIGNATURE', 'TITULAIRE', 'AUTORITE', 'DIRECTEUR', 'GENERAL', 'AMN', 'WATANI', 'MAMLAKA',
      'MAGHRIBIYA', 'BATAQA', 'WATANIYA', 'TAARIF', 'LENOVO', 'HP', 'DELL', 'SAMSUNG', 'APPLE',
      'VILLE', 'COMMUNE', 'PROVINCE', 'DATE', 'LIEU', 'NAISSANCE', 'MALL', 'AGILA', 'CAY'
    ]);

    // 1. Parcourir les lignes lues par l'OCR sur la carte
    const detectedNameLines: string[] = [];

    for (const rawLine of lines) {
      const upperLine = rawLine.toUpperCase().trim();

      // Ignorer les lignes d'en-tête, de date de naissance, de validité ou du N° CIN
      if (
        /ROYAUME|CARTE NATIONALE|VALABLE|N[ÉE]\s+LE|CAN\s*\d|N°\s*[A-Z]/.test(upperLine) ||
        /\d{2}[\.\/\-]\d{2}[\.\/\-]\d{4}/.test(upperLine)
      ) {
        continue;
      }

      // Nettoyer la ligne pour ne garder que les lettres latines lues sur la carte
      const cleanLine = rawLine.replace(/[^A-Za-zÀ-ÿ\s\-']/g, '').trim();
      const upperClean = cleanLine.toUpperCase();

      // Les vrais noms sur la carte sont en MAJUSCULES (au moins 2 lettres) et ne sont pas des mots de l'en-tête
      const isPureUppercase = cleanLine.length >= 2 && cleanLine === cleanLine.toUpperCase();

      if (isPureUppercase && !IGNORED_TERMS.has(upperClean) && !result.cinPassport?.includes(upperClean)) {
        detectedNameLines.push(cleanLine);
      }
    }

    // 2. Affectation directe des données réelles lues sur la carte :
    // Sur la carte marocaine : 1ère ligne lue = Prénom, 2ème ligne lue = Nom de famille
    if (detectedNameLines.length >= 2) {
      result.firstName = this.capitalizeWords(detectedNameLines[0]);
      result.lastName = this.capitalizeWords(detectedNameLines[1]);
    } else if (detectedNameLines.length === 1) {
      const singleLineWords = detectedNameLines[0].split(/\s+/).filter(w => w.length >= 2);
      if (singleLineWords.length >= 2) {
        result.firstName = this.capitalizeWords(singleLineWords[0]);
        result.lastName = this.capitalizeWords(singleLineWords.slice(1).join(' '));
      } else {
        result.firstName = this.capitalizeWords(detectedNameLines[0]);
      }
    }

    // Fallback labels si non trouvé
    if (!result.firstName || !result.lastName) {
      this.extractNameFromLabels(lines, result);
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

  private normalizeDate(dateStr: string): string {
    const clean = dateStr.replace(/[\.\/\-]/g, '-');
    const parts = clean.split('-');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return dateStr;
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
