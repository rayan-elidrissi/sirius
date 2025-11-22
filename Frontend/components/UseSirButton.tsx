import { Link } from 'react-router-dom'
import cloud1Svg from '@/assets/svg/cloud-1-.svg'
import cloud2Svg from '@/assets/svg/cloud-2.svg'
import drawSiriusSvg from '@/assets/svg/draw-sirius-2.svg'
import planeFlagSvg from '@/assets/svg/plane-flag.svg'

export default function UseSirButton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white relative overflow-hidden">
      {/* Nuages animés */}
      <img 
        src={cloud1Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '5%',
          left: '-12.5rem',
          width: '9.375rem',
          height: 'auto',
          animationDelay: '0s',
          animationDuration: '20s'
        }}
      />
      <img 
        src={cloud2Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '10%',
          left: '-12.5rem',
          width: '7.5rem',
          height: 'auto',
          animationDelay: '5s',
          animationDuration: '25s'
        }}
      />
      <img 
        src={cloud1Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '3%',
          left: '-12.5rem',
          width: '11.25rem',
          height: 'auto',
          animationDelay: '10s',
          animationDuration: '30s'
        }}
      />
      <img 
        src={cloud2Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '7%',
          left: '-12.5rem',
          width: '8.75rem',
          height: 'auto',
          animationDelay: '15s',
          animationDuration: '22s'
        }}
      />
      <img 
        src={cloud1Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '12%',
          left: '-12.5rem',
          width: '10rem',
          height: 'auto',
          animationDelay: '20s',
          animationDuration: '28s'
        }}
      />
      <img 
        src={cloud2Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '2%',
          left: '-12.5rem',
          width: '6.25rem',
          height: 'auto',
          animationDelay: '25s',
          animationDuration: '18s'
        }}
      />
      <img 
        src={cloud1Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '14%',
          left: '-12.5rem',
          width: '8.125rem',
          height: 'auto',
          animationDelay: '30s',
          animationDuration: '24s'
        }}
      />
      <img 
        src={cloud2Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '1%',
          left: '-12.5rem',
          width: '10.625rem',
          height: 'auto',
          animationDelay: '35s',
          animationDuration: '26s'
        }}
      />
      <img 
        src={cloud1Svg} 
        alt="Cloud" 
        className="absolute cloud-move z-0"
        style={{ 
          top: '9%',
          left: '-12.5rem',
          width: '6.875rem',
          height: 'auto',
          animationDelay: '40s',
          animationDuration: '21s'
        }}
      />
      
      {/* Avion animé */}
      <img 
        src={planeFlagSvg} 
        alt="Plane" 
        className="absolute plane-move-reverse z-0"
        style={{ 
          top: '25%',
          right: '-12.5rem',
          width: '15.625rem',
          height: 'auto',
          animationDuration: '15s'
        }}
      />
      
      {/* Image de fond draw-sirius-2 */}
      <img 
        src={drawSiriusSvg} 
        alt="Sirius Background" 
        className="absolute inset-0 w-full h-full object-cover z-10"
      />

      <Link
        to="/use-sir"
        className="relative z-30 inline-flex items-center gap-4 px-12 py-6 bg-[#CCA9DD] rounded-xl text-black font-medium text-4xl transition-all duration-200 hover:brightness-110 group"
      >
        <div>Launch SIR</div>

        {/* Icône inspirée du bouton Webflow */}
        <div className="relative flex items-center justify-center" style={{ width: '2rem', height: '2rem' }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 10 8"
            className="w-full h-full arrow-icon transition-transform duration-300 ease-in-out"
            fill="currentColor"
          >
            <path d="M4.45231 0.385986H6.02531L9.30131 3.99999L6.02531 7.61399H4.45231L7.40331 4.58499H0.695312V3.42799H7.41631L4.45231 0.385986Z" />
          </svg>
        </div>
      </Link>
    </div>
  );
}

