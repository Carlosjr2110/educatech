'use client'


interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const handleEmailClick = () => {
    window.location.href = "mailto:zagal2057@gmail.com";
  };

  return (
    <footer className={`bg-blue-950 text-gray-300 py-4 sm:py-6 px-4 w-full shadow-inner ${className ?? ''}`}>
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 text-xs sm:text-base text-center sm:text-left">
        
    
        <div className="flex items-center gap-2 justify-center sm:justify-start">
          <div className="font-bold">Contato:</div>
          <button
            onClick={handleEmailClick}
            className="hover:text-white transition-colors flex items-center gap-2"
            aria-label="Contato por e-mail"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span>carloshumberto2110@gmail.com</span>
          </button>
        </div>

     
        <div>
          © {new Date().getFullYear()} <span className="font-semibold text-white">Educa Tech</span>. Todos os direitos reservados.
        </div>

        <div className="flex items-center gap-2 justify-center sm:justify-end">
  <span>Desenvolvido por</span>
  <a
    href="https://portfoliocarlosdev.vercel.app/"
    target="_blank"
    rel="noopener noreferrer"
    className="hover:opacity-90 transition-opacity"
  >
    <img 
      src="/logo.png" 
      alt="Carlos Dev Logo" 
      className="h-6 w-auto" 
    />
  </a>
</div>

      </div>
    </footer>
  );
};

export default Footer;