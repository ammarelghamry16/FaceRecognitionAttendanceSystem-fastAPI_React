// Type declarations for JSX components

declare module '@/components/LaserFlow' {
    import { CSSProperties, FC } from 'react';

    export interface LaserFlowProps {
        className?: string;
        style?: CSSProperties;
        wispDensity?: number;
        dpr?: number;
        mouseSmoothTime?: number;
        mouseTiltStrength?: number;
        horizontalBeamOffset?: number;
        verticalBeamOffset?: number;
        flowSpeed?: number;
        verticalSizing?: number;
        horizontalSizing?: number;
        fogIntensity?: number;
        fogScale?: number;
        wispSpeed?: number;
        wispIntensity?: number;
        flowStrength?: number;
        decay?: number;
        falloffStart?: number;
        fogFallSpeed?: number;
        color?: string;
    }

    const LaserFlow: FC<LaserFlowProps>;
    export { LaserFlow };
    export default LaserFlow;
}

declare module '@/components/LightPillar' {
    import { CSSProperties, FC } from 'react';

    export interface LightPillarProps {
        topColor?: string;
        bottomColor?: string;
        intensity?: number;
        rotationSpeed?: number;
        interactive?: boolean;
        className?: string;
        glowAmount?: number;
        pillarWidth?: number;
        pillarHeight?: number;
        noiseIntensity?: number;
        mixBlendMode?: CSSProperties['mixBlendMode'];
        pillarRotation?: number;
    }

    const LightPillar: FC<LightPillarProps>;
    export { LightPillar };
    export default LightPillar;
}

declare module '@/components/MagicBento' {
    import { FC } from 'react';

    export interface MagicBentoProps {
        textAutoHide?: boolean;
        enableStars?: boolean;
        enableSpotlight?: boolean;
        enableBorderGlow?: boolean;
        disableAnimations?: boolean;
        spotlightRadius?: number;
        particleCount?: number;
        enableTilt?: boolean;
        glowColor?: string;
        clickEffect?: boolean;
        enableMagnetism?: boolean;
    }

    const MagicBento: FC<MagicBentoProps>;
    export default MagicBento;
}


declare module '@/components/ui/3d-marquee' {
    import { FC } from 'react';

    export interface ThreeDMarqueeProps {
        images: string[];
        className?: string;
    }

    export const ThreeDMarquee: FC<ThreeDMarqueeProps>;
}
