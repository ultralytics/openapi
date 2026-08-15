// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

/** Documentation brand mark. Replace this file and app/icon.svg (plus the --brand-gradient-* tokens) to rebrand. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg aria-label="Logo" className={className} role="img" viewBox="0 0 107 92" xmlns="http://www.w3.org/2000/svg">
      <title>Logo</title>
      <path
        d="M56.7478 25.1939L56.7365 38.0286C56.7824 55.5439 42.5251 69.8368 25.1086 69.8148C18.1905 69.8036 11.8932 67.6925 6.78925 63.9998C15.9461 80.5019 33.5065 91.6475 53.471 91.6608C82.4752 91.6378 106.447 67.9677 106.902 38.8701L106.895 38.7488C106.922 38.0783 106.894 25.6714 106.927 25.1223C106.889 11.317 95.6288 -0.0290768 81.8562 0.00597989C68.0198 -0.0165355 56.7033 11.2672 56.7478 25.1939Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M25.0789 12.9165C11.2511 12.9165 0.000768562 24.1938 0.000768562 38.0553C0.000768562 51.9154 11.2511 63.1926 25.0789 63.1926C38.9075 63.1926 50.157 51.9154 50.157 38.0553C50.157 24.1938 38.9075 12.9165 25.0789 12.9165Z"
        fill="var(--brand-gradient-end)"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="logo-gradient"
          x1="30.262"
          x2="87.8343"
          y1="90.7946"
          y2="27.1709"
        >
          <stop stopColor="var(--brand-gradient-start)" />
          <stop offset="1" stopColor="var(--brand-gradient-end)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
