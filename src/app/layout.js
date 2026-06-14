import "./globals.css";

export const metadata = {
  // ── 기본 ──────────────────────────────────────────
  title: {
    default: "전주대학교 온스타 플러스",
    template: "전주대학교 온스타 플러스",
  },
  description:
    "전주대학교 비교과 프로그램 정보를 한눈에 확인하세요. 장학금·상금·SRP 혜택 필터링, 단과대·학과·학년별 신청 가능 여부 정보 제공.",
  keywords: [
    "전주대학교", "전주대", "비교과", "비교과 프로그램", "온스타", "장학금", "SRP",
  ],

  // ── Open Graph (카카오톡·SNS 공유 시 미리보기) ────
  openGraph: {
    title: "전주대학교 온스타 플러스",
    description:
      "전주대학교 비교과 프로그램 정보를 한눈에 확인하세요. 학과, 학년별 신청 가능 여부, 장학금·상금·SRP 혜택 필터링 지원.",
    url: "https://jjplus.kro.kr",   // ← 실제 배포 도메인으로 교체
    siteName: "전주대학교 온스타 플러스",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://jjplus.kro.kr/img/og_image.png",  // ← 아래 2번 참고
        width: 1200,
        height: 630,
        alt: "전주대학교 온스타 플러스",
      },
    ],
  },

  // ── Twitter / X 카드 ──────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "전주대학교 온스타 플러스",
    description:
      "전주대학교 비교과 프로그램 정보를 한눈에 확인하세요. 학과, 학년별 신청 가능 여부, 장학금·상금·SRP 혜택 필터링 지원.",
    images: ["https://jjplus.kro.kr/img/og_image.png"],
  },

  // ── 검색엔진 크롤링 허용 ──────────────────────────
  robots: {
    index: true,
    follow: true,
  },

  // ── 정식 URL (중복 페이지 방지) ──────────────────
  alternates: {
    canonical: "https://jjplus.kro.kr",  // ← 실제 배포 도메인으로 교체
  },
};

// RootLayout 컴포넌트
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
