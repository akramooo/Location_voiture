import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="accueil" class="hero-section">
      <!-- Glow Aura Spotlight in Background -->
      <div class="glow-spotlight"></div>

      <div class="hero-content">
        <div class="hero-tag-pill fade-in">
          <span class="sparkle-icon">✨</span>
          <span>Plateforme SaaS Next-Gen pour Agences de Location</span>
        </div>

        <h1 class="hero-title">
          La Gestion de Flotte Automobile, <br>
          <span class="gradient-text">Redéfinie avec Élégance.</span>
        </h1>
        
        <p class="hero-subtitle">
          Une suite logicielle d'exception pour piloter vos contrats, votre parc, vos clients et vos finances avec une précision chirurgicale.
        </p>

        <div class="hero-buttons">
          <a href="#fonctionnalites" class="btn btn-hero-primary">
            <span>Découvrir les Fonctionnalités</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
          <a href="#contact" class="btn btn-hero-secondary">
            <i class="fa-solid fa-phone"></i>
            <span>Nous Contacter</span>
          </a>
        </div>

        <!-- Sleek App Mockup Frame -->
        <div class="mockup-frame-container">
          <div class="mockup-glass-bar">
            <div class="window-controls">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="address-bar">
              <i class="fa-solid fa-lock"></i> app.rentflow.ma/dashboard
            </div>
            <div class="live-status">
              <span class="pulse-dot"></span> LIVE ERP
            </div>
          </div>
          
          <div class="mockup-screen-content">
            <div class="kpi-preview-row">
              <div class="mini-kpi-card">
                <div class="mini-kpi-label">Contrats Départs (Aujourd'hui)</div>
                <div class="mini-kpi-val green-glow">4 <span class="mini-kpi-sub">2 prêts</span></div>
              </div>
              <div class="mini-kpi-card">
                <div class="mini-kpi-label">Contrats Retours (Aujourd'hui)</div>
                <div class="mini-kpi-val blue-glow">4 <span class="mini-kpi-sub">0 retard</span></div>
              </div>
              <div class="mini-kpi-card">
                <div class="mini-kpi-label">Revenu du Jour</div>
                <div class="mini-kpi-val cyan-glow">12,800 MAD</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      position: relative;
      padding: 90px 24px 60px 24px;
      text-align: center;
      max-width: 1080px;
      margin: 0 auto;
    }

    .glow-spotlight {
      position: absolute;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 650px;
      height: 400px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(59, 130, 246, 0.12) 40%, rgba(0,0,0,0) 70%);
      filter: blur(60px);
      pointer-events: none;
      z-index: 0;
    }

    .hero-content {
      position: relative;
      z-index: 1;
    }

    .hero-tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.85rem;
      color: #cbd5e1;
      margin-bottom: 28px;
      backdrop-filter: blur(12px);
    }

    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: 3.6rem;
      font-weight: 800;
      line-height: 1.12;
      letter-spacing: -0.02em;
      margin-bottom: 22px;
      color: #ffffff;
    }

    .gradient-text {
      background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #38bdf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      color: #94a3b8;
      max-width: 720px;
      margin: 0 auto 38px auto;
      line-height: 1.6;
    }

    .hero-buttons {
      display: flex;
      justify-content: center;
      gap: 18px;
      margin-bottom: 50px;
    }

    .btn-hero-primary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      padding: 16px 36px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 1rem;
      text-decoration: none;
      box-shadow: 0 10px 30px -5px rgba(99, 102, 241, 0.5);
      transition: all 0.25s ease;
    }

    .btn-hero-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 40px -5px rgba(99, 102, 241, 0.7);
    }

    .btn-hero-secondary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      color: #e2e8f0;
      padding: 16px 30px;
      border-radius: 14px;
      font-weight: 600;
      font-size: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      text-decoration: none;
      backdrop-filter: blur(10px);
      transition: all 0.25s ease;
    }

    .btn-hero-secondary:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .mockup-frame-container {
      max-width: 920px;
      margin: 0 auto;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(20px);
      box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.15);
      overflow: hidden;
    }

    .mockup-glass-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 22px;
      background: rgba(10, 15, 26, 0.9);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .window-controls { display: flex; gap: 8px; }
    .window-controls .dot { width: 11px; height: 11px; border-radius: 50%; }
    .window-controls .dot.red { background: #ef4444; }
    .window-controls .dot.yellow { background: #f59e0b; }
    .window-controls .dot.green { background: #10b981; }

    .address-bar {
      font-size: 0.78rem;
      color: #64748b;
      background: rgba(255, 255, 255, 0.03);
      padding: 5px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .live-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: #10b981;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }

    .mockup-screen-content {
      padding: 32px;
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(7, 9, 14, 0.8) 100%);
    }

    .kpi-preview-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .mini-kpi-card {
      padding: 22px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.06);
      text-align: left;
    }

    .mini-kpi-label { font-size: 0.78rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
    .mini-kpi-val { font-size: 2.1rem; font-weight: 800; color: #ffffff; margin-top: 8px; }
    .mini-kpi-sub { font-size: 0.85rem; font-weight: 600; }
    .green-glow { color: #34d399; }
    .blue-glow { color: #60a5fa; }
    .cyan-glow { color: #38bdf8; }
  `]
})
export class LandingHeroComponent {}
