"use client";

import { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";
import Image from 'next/image';

// ── 상수 ──────────────────────────────────────────────
const ITEMS_PER_PAGE_DESKTOP = 9;
const ITEMS_PER_PAGE_TABLET = 6;
const ITEMS_PER_PAGE_MOBILE = 4;

// ── 유틸 ──────────────────────────────────────────────
function getItemsPerPage(width) {
  if (width >= 1024) return ITEMS_PER_PAGE_DESKTOP;
  if (width >= 640) return ITEMS_PER_PAGE_TABLET;
  return ITEMS_PER_PAGE_MOBILE;
}

function getDdayColor(dday) {
  const n = parseInt(dday.replace("D-", ""), 10);
  if (isNaN(n) || n === 0) return "#EF4444";
  if (n <= 3) return "#F59E0B";
  if (n <= 7) return "#3B82F6";
  return "#6B7280";
}

function getMemberStatus(memberCnt) {
  const [cur, max] = memberCnt.split(" / ").map(Number);
  if (isNaN(cur) || isNaN(max)) return { ratio: 0, full: false };
  return { ratio: Math.min(cur / max, 1), full: cur >= max, cur, max };
}

// ── 로딩 팝업 ─────────────────────────────────────────
function LoadingPopup() {
  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingBox}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>데이터 불러오는 중...</p>
        <p className={styles.loadingSubtext}>비교과 프로그램 정보를 가져오고 있어요</p>
      </div>
    </div>
  );
}

// ── 온스타 이동 확인 모달 ──────────────────────────────
function OnstarModal({ progTitle, onConfirm, onCancel }) {
  // ESC 키로 닫기
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIconWrap}>
          <span className={styles.modalIcon}>📋</span>
        </div>
        <p className={styles.modalCopied}>프로그램명이 복사되었습니다</p>
        <p className={styles.modalProgTitle}>"{progTitle}"</p>
        <p className={styles.modalDesc}>
          전주대학교 <strong>온스타</strong>에서 신청하실 수 있어요.<br />
          지금 온스타로 이동하시겠습니까?
        </p>
        <div className={styles.modalButtons}>
          <button className={styles.modalBtnCancel} onClick={onCancel}>
            아니오
          </button>
          <button className={styles.modalBtnConfirm} onClick={onConfirm}>
            네, 이동할게요
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 프로그램 카드 ──────────────────────────────────────
function ProgramCard({ prog, onCardClick }) {
  const ddayColor = getDdayColor(prog.DDAY);
  const member = getMemberStatus(prog.MEMBER_CNT);

  const targetText =
    prog.TARGET_DAEHAK === "any"
      ? "전체 단과대"
      : prog.TARGET_HAKBU === "any"
      ? prog.TARGET_DAEHAK
      : `${prog.TARGET_DAEHAK} · ${prog.TARGET_HAKBU}`;

  const gradeText =
    prog.TARGET_GRADE.length === 5
      ? "전학년"
      : prog.TARGET_GRADE.map((g) => `${g}학년`).join(", ");

  return (
    <div
      className={`${styles.card} ${member.full ? styles.cardFull : ""}`}
      onClick={() => onCardClick(prog.PROG_TITLE)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onCardClick(prog.PROG_TITLE)}
    >
      {/* D-Day 배지 */}
      <div className={styles.ddayBadge} style={{ background: ddayColor }}>
        {prog.DDAY}
      </div>

      {/* 수혜 배지 행 */}
      <div className={styles.benefitRow}>
        {prog.JANGHAK && (
          <span className={`${styles.badge} ${styles.badgeGreen}`}>🎓 장학금</span>
        )}
        {prog.SANG && (
          <span className={`${styles.badge} ${styles.badgeAmber}`}>🏆 상금</span>
        )}
        {prog.SRP && (
          <span className={`${styles.badge} ${styles.badgePurple}`}>⭐ SRP</span>
        )}
        {!prog.JANGHAK && !prog.SANG && !prog.SRP && (
          <span className={styles.badgeNone}>
            <Image 
              src="/img/money.png" alt="돈모양 이미지" width={24} height={15}
              style={{marginRight: "5px"}}
            />
            혜택 없음
          </span>
        )}
      </div>

      {/* 제목 */}
      <h3 className={styles.cardTitle}>{prog.PROG_TITLE}</h3>

      {/* 정보 목록 */}
      <ul className={styles.infoList}>
        <li>
          <span className={styles.infoIcon}>📅</span>
          <span className={styles.infoLabel}>교육 기간</span>
          <span className={styles.infoValue}>{prog.APP_DATE}</span>
        </li>
        <li>
          <span className={styles.infoIcon}>🕐</span>
          <span className={styles.infoLabel}>교육 시간</span>
          <span className={styles.infoValue}>{prog.PROG_TIME_INFO}</span>
        </li>
        <li>
          <span className={styles.infoIcon}>🏫</span>
          <span className={styles.infoLabel}>대상</span>
          <span className={styles.infoValue}>{targetText}</span>
        </li>
        <li>
          <span className={styles.infoIcon}>🎓</span>
          <span className={styles.infoLabel}>학년</span>
          <span className={styles.infoValue}>{gradeText}</span>
        </li>
      </ul>

      {/* 신청 현황 */}
      <div className={styles.memberSection}>
        <div className={styles.memberHeader}>
          <span className={styles.memberLabel}>신청 현황</span>
          <span className={`${styles.memberCount} ${member.full ? styles.memberFull : ""}`}>
            {prog.MEMBER_CNT}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${member.ratio * 100}%`,
              background: member.full
                ? "#EF4444"
                : member.ratio > 0.8
                ? "#F59E0B"
                : "#3B82F6",
            }}
          />
        </div>
      </div>

      {/* 클릭 힌트 */}
      <div className={styles.cardClickHint}>클릭하여 복사하기 →</div>
    </div>
  );
}

// ── 필터 패널 ──────────────────────────────────────────
function FilterPanel({ hakbuData, filters, setFilters, onReset }) {
  const colleges = hakbuData?.DAEHAK_LIST?.DAEHAK || [];

  const selectedCollege = colleges.find(
    (c) => c["@_name"] === filters.daehak
  );
  const departments = selectedCollege?.HAKBU || [];

  function toggle(key) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  function handleDaehak(val) {
    setFilters((f) => ({ ...f, daehak: val, hakbu: "" }));
  }

  function handleHakbu(val) {
    setFilters((f) => ({ ...f, hakbu: val }));
  }

  function handleGrade(grade) {
    setFilters((f) => {
      const grades = f.grades.includes(grade)
        ? f.grades.filter((g) => g !== grade)
        : [...f.grades, grade];
      return { ...f, grades };
    });
  }

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <span className={styles.filterTitle}>🔍 필터</span>
        <button className={styles.resetBtn} onClick={onReset}>
          초기화
        </button>
      </div>

      {/* 신청 가능여부 필터링 */}
      <div className={styles.filterSection}>
        <p className={styles.filterSectionLabel}>신청 가능여부 필터링</p>
        <div className={styles.filterGrid}>
          {/* 단과대 */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>단과대학</label>
            <select
              className={styles.filterSelect}
              value={filters.daehak}
              onChange={(e) => handleDaehak(e.target.value)}
            >
              <option value="">전체</option>
              {colleges.map((c) => (
                <option key={c["@_code"]} value={c["@_name"]}>
                  {c["@_name"]}
                </option>
              ))}
            </select>
          </div>

          {/* 학부 */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>학부(학과)</label>
            <select
              className={styles.filterSelect}
              value={filters.hakbu}
              onChange={(e) => handleHakbu(e.target.value)}
              disabled={!filters.daehak}
            >
              <option value="">전체</option>
              {(Array.isArray(departments) ? departments : [departments]).map(
                (h) => (
                  <option key={h["@_code"]} value={h["@_name"]}>
                    {h["@_name"]}
                  </option>
                )
              )}
            </select>
          </div>

          {/* 학년 */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>학년</label>
            <div className={styles.gradeButtons}>
              {["1", "2", "3", "4", "5"].map((g) => (
                <button
                  key={g}
                  className={`${styles.gradeBtn} ${
                    filters.grades.includes(g) ? styles.gradeBtnActive : ""
                  }`}
                  onClick={() => handleGrade(g)}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.filterDivider} />

      {/* 혜택 지급 여부 필터링 */}
      <div className={styles.filterSection}>
        <p className={styles.filterSectionLabel}>
          <Image 
            src="/img/money.png" alt="돈모양 이미지" width={24} height={15}
            style={{marginRight: "5px"}}
          />
          혜택 지급 여부 필터링
        </p>
        <div className={styles.benefitToggles}>
          <button
            className={`${styles.toggleBtn} ${styles.toggleGreen} ${
              filters.janghak ? styles.toggleActive : ""
            }`}
            onClick={() => toggle("janghak")}
          >
            🎓 장학금
          </button>
          <button
            className={`${styles.toggleBtn} ${styles.toggleAmber} ${
              filters.sang ? styles.toggleActive : ""
            }`}
            onClick={() => toggle("sang")}
          >
            🏆 상금
          </button>
          <button
            className={`${styles.toggleBtn} ${styles.togglePurple} ${
              filters.srp ? styles.toggleActive : ""
            }`}
            onClick={() => toggle("srp")}
          >
            ⭐ SRP
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 페이지네이션 ───────────────────────────────────────
function Pagination({ total, current, perPage, onChange }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    }
  }

  const withEllipsis = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) {
      withEllipsis.push("...");
    }
    withEllipsis.push(p);
  });

  return (
    <div className={styles.pagination}>
      <button
        className={styles.pageBtn}
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
      >
        ‹
      </button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={`${styles.pageBtn} ${
              p === current ? styles.pageBtnActive : ""
            }`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        className={styles.pageBtn}
        disabled={current === totalPages}
        onClick={() => onChange(current + 1)}
      >
        ›
      </button>
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────
export default function Home() {
  const [programs, setPrograms] = useState([]);
  const [hakbuData, setHakbuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  const [modal, setModal] = useState(null); // null | { title: string }

  const [filters, setFilters] = useState({
    daehak: "",
    hakbu: "",
    grades: [],
    janghak: false,
    sang: false,
    srp: false,
  });

  // 반응형 width 추적
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 데이터 fetch
  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [progRes, hakbuRes] = await Promise.all([
          fetch("/api/all-prog"),
          fetch("/hakbu_data.xml"),
        ]);

        if (!progRes.ok) throw new Error("프로그램 데이터 로드 실패");
        const progJson = await progRes.json();
        setPrograms(progJson.data || []);

        if (hakbuRes.ok) {
          const xmlText = await hakbuRes.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const daehakList = xmlDoc.querySelector("DAEHAK_LIST");
          const daehaks = Array.from(daehakList.querySelectorAll("DAEHAK")).map(
            (d) => ({
              "@_code": d.getAttribute("code"),
              "@_name": d.getAttribute("name"),
              HAKBU: Array.from(d.querySelectorAll("HAKBU")).map((h) => ({
                "@_code": h.getAttribute("code"),
                "@_name": h.getAttribute("name"),
              })),
            })
          );
          setHakbuData({ DAEHAK_LIST: { DAEHAK: daehaks } });
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const itemsPerPage = getItemsPerPage(windowWidth);

  // 필터링
  const filtered = useMemo(() => {
    return programs.filter((p) => {
      if (filters.daehak) {
        if (p.TARGET_DAEHAK !== "any" && p.TARGET_DAEHAK !== filters.daehak)
          return false;
      }
      if (filters.hakbu) {
        if (p.TARGET_HAKBU !== "any" && p.TARGET_HAKBU !== filters.hakbu)
          return false;
      }
      if (filters.grades.length > 0) {
        const hasGrade = filters.grades.some((g) => p.TARGET_GRADE.includes(g));
        if (!hasGrade) return false;
      }
      if (filters.janghak && !p.JANGHAK) return false;
      if (filters.sang && !p.SANG) return false;
      if (filters.srp && !p.SRP) return false;
      return true;
    });
  }, [programs, filters]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const paginated = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  function resetFilters() {
    setFilters({
      daehak: "",
      hakbu: "",
      grades: [],
      janghak: false,
      sang: false,
      srp: false,
    });
  }

  // 카드 클릭 → 제목 복사 + 모달 오픈
  async function handleCardClick(title) {
    try {
      await navigator.clipboard.writeText(title);
    } catch {
      // clipboard 실패 시 fallback
      const el = document.createElement("textarea");
      el.value = title;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setModal({ title });
  }

  function handleModalConfirm() {
    window.open("https://onstar.jj.ac.kr/", "_blank", "noopener,noreferrer");
    setModal(null);
  }

  function handleModalCancel() {
    setModal(null);
  }

  return (
    <main className={styles.main}>
      {loading && <LoadingPopup />}

      {/* 온스타 이동 모달 */}
      {modal && (
        <OnstarModal
          progTitle={modal.title}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}

      {/* 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLogo}>
            <Image className={styles.logoIcon}
              src="/img/logo.png" alt="사이트 로고" width={36} height={36}
            />
            <div>
              <h1 className={styles.logoTitle}>전주대학교 온스타 플러스</h1>
              <p className={styles.logoSub}>비교과 프로그램 주요 정보만 빠르게</p>
            </div>
          </div>
          {!loading && !error && (
            <div className={styles.headerStats}>
              <span className={styles.statNum}>{filtered.length}</span>
              <span className={styles.statLabel}>개 프로그램</span>
            </div>
          )}
        </div>
      </header>

      <div className={styles.container}>
        {error ? (
          <div className={styles.errorBox}>
            <p>⚠️ {error}</p>
            <p>잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : (
          <>
            {/* 필터 */}
            {!loading && (
              <FilterPanel
                hakbuData={hakbuData}
                filters={filters}
                setFilters={setFilters}
                onReset={resetFilters}
              />
            )}

            {/* 결과 없음 */}
            {!loading && filtered.length === 0 && (
              <div className={styles.emptyBox}>
                <p className={styles.emptyIcon}>🔎</p>
                <p className={styles.emptyTitle}>조건에 맞는 프로그램이 없어요</p>
                <p className={styles.emptyDesc}>
                  필터를 변경하거나 초기화해 보세요.
                </p>
                <button className={styles.emptyResetBtn} onClick={resetFilters}>
                  필터 초기화
                </button>
              </div>
            )}

            {/* 카드 그리드 */}
            {!loading && paginated.length > 0 && (
              <>
                <div className={styles.grid}>
                  {paginated.map((p, i) => (
                    <ProgramCard
                      key={`${p.GWAMOK_CODE}-${p.GWAMOK_BUNBAN}-${i}`}
                      prog={p}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>

                <Pagination
                  total={filtered.length}
                  current={page}
                  perPage={itemsPerPage}
                  onChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            )}
          </>
        )}
      </div>

      {/* 푸터 */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerDisclaimer}>
            이 웹사이트는 전주대학교 비교과 프로그램 정보를 편의상 제공하는 개인 서비스로,
            전주대학교에서 공식적으로 운영하거나 지원하는 사이트가 아닙니다.
            정확한 정보는 <a href="https://onstar.jj.ac.kr/" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>전주대학교 온스타</a>에서 확인하시기 바랍니다.
          </p>
          <p className={styles.footerCopyright}>Copyright © 2026 Son Ji Ho. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}