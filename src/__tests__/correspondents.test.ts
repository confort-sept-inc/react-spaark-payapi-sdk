import {
  CORRESPONDENTS,
  CORRESPONDENT_INFO,
  DEFAULT_LIMITS,
} from '../constants/correspondents';

describe('correspondents', () => {
  describe('CORRESPONDENTS', () => {
    it('should include all CEMAC region operators', () => {
      expect(CORRESPONDENTS).toContain('MTN_MOMO_CMR');
      expect(CORRESPONDENTS).toContain('ORANGE_CMR');
      expect(CORRESPONDENTS).toContain('MTN_MOMO_COG');
      expect(CORRESPONDENTS).toContain('AIRTEL_COG');
      expect(CORRESPONDENTS).toContain('MTN_MOMO_GAB');
      expect(CORRESPONDENTS).toContain('AIRTEL_GAB');
    });

    it('should have exactly 6 correspondents', () => {
      expect(CORRESPONDENTS).toHaveLength(6);
    });
  });

  describe('CORRESPONDENT_INFO', () => {
    it('should have info for all correspondents', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        expect(CORRESPONDENT_INFO[correspondent]).toBeDefined();
      });
    });

    it('should have correct country codes', () => {
      expect(CORRESPONDENT_INFO.MTN_MOMO_CMR.countryCode).toBe('CMR');
      expect(CORRESPONDENT_INFO.ORANGE_CMR.countryCode).toBe('CMR');
      expect(CORRESPONDENT_INFO.MTN_MOMO_COG.countryCode).toBe('COG');
      expect(CORRESPONDENT_INFO.AIRTEL_COG.countryCode).toBe('COG');
      expect(CORRESPONDENT_INFO.MTN_MOMO_GAB.countryCode).toBe('GAB');
      expect(CORRESPONDENT_INFO.AIRTEL_GAB.countryCode).toBe('GAB');
    });

    it('should have XAF currency for all CEMAC operators', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        expect(CORRESPONDENT_INFO[correspondent].currency).toBe('XAF');
      });
    });

    it('should have phone regex patterns', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        expect(CORRESPONDENT_INFO[correspondent].phoneRegex).toBeInstanceOf(RegExp);
      });
    });

    it('should include deposit and payout features', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        const features = CORRESPONDENT_INFO[correspondent].features;
        expect(features).toContain('deposit');
        expect(features).toContain('payout');
      });
    });
  });

  describe('DEFAULT_LIMITS', () => {
    it('should have limits for all correspondents', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        expect(DEFAULT_LIMITS[correspondent]).toBeDefined();
      });
    });

    it('should have min and max deposit amounts', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        const limits = DEFAULT_LIMITS[correspondent];
        expect(limits.minDeposit).toBeDefined();
        expect(limits.maxDeposit).toBeDefined();
        expect(typeof limits.minDeposit).toBe('number');
        expect(typeof limits.maxDeposit).toBe('number');
      });
    });

    it('should have min and max payout amounts', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        const limits = DEFAULT_LIMITS[correspondent];
        expect(limits.minPayout).toBeDefined();
        expect(limits.maxPayout).toBeDefined();
        expect(typeof limits.minPayout).toBe('number');
        expect(typeof limits.maxPayout).toBe('number');
      });
    });

    it('should have min less than max for deposits', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        const limits = DEFAULT_LIMITS[correspondent];
        expect(limits.minDeposit).toBeLessThan(limits.maxDeposit);
      });
    });

    it('should have min less than max for payouts', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        const limits = DEFAULT_LIMITS[correspondent];
        expect(limits.minPayout).toBeLessThan(limits.maxPayout);
      });
    });

    it('should have reasonable min deposit amounts (>= 100 XAF)', () => {
      CORRESPONDENTS.forEach((correspondent) => {
        expect(DEFAULT_LIMITS[correspondent].minDeposit).toBeGreaterThanOrEqual(100);
      });
    });
  });
});
