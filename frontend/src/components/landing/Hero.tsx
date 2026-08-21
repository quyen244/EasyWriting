
"use client";
import Link from "next/link";
import { motion } from "motion/react"; // thêm import này

import ScoringDemo from "@/components/landing/ScoringDemo";
import CountUp from "@/components/motion/CountUp";
import { MaskLine, MaskLines } from "@/components/motion/MaskLine";
import Highlighter from "@/components/motion/Highlighter";
import Reveal from "@/components/motion/Reveal";
import { GlobeIcon, LockIcon, MicIcon, PencilIcon } from "@/components/ui/Icon";
import { Star } from "@/components/ui/Sticker";
import bgImage from "../../../assets/BG.png";

const STATS = [
  { figure: "500K+", label: "Bài đã chấm" },
  { figure: "95%+", label: "Độ chính xác" },
  { figure: "+1.5", label: "Band cải thiện" },
];

export default function Hero() {
  // Định nghĩa các delay cho từng phần tử
  const delays = {
    eyebrow: 0,
    title: 0.15,
    description: 0.3,
    buttons: 0.45,
    stats: 0.6,
    reviews: 0.75,
    scoring: 0.4,
  };

  // Dùng motion.div cho từng khối với hiệu ứng trượt từ trái/phải
  return (
    <section className="relative flex min-h-screen w-full items-start overflow-hidden pt-[20vh] pb-20 lg:pt-[20vh] lg:pb-16">
      {/* Background ảnh - phủ toàn màn hình */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-70"
        style={{ backgroundImage: `url(${bgImage.src})` }}
      />

      {/* Dot grid - lớp trang trí */}
      <span
        aria-hidden="true"
        data-decoration
        className="dot-grid absolute inset-0 -z-10"
      />

      <div className="mx-auto grid w-full max-w-container items-center gap-x-8 gap-y-10 px-4 lg:grid-cols-12 lg:px-6 xl:gap-x-12">
        {/* Cột trái - nội dung chính */}
        <div className="relative lg:col-span-7">
          <Star className="absolute -left-5 -top-6 hidden size-8 text-accent-yellow lg:block" />

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delays.eyebrow }}
          >
            <Reveal variant="cut" className="mb-5 flex items-center gap-3">
              <span aria-hidden="true" className="block h-[2px] w-8 bg-primary-container" />
              <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant lg:text-xs">
                Chấm bài IELTS chuẩn quốc tế
              </p>
            </Reveal>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delays.title }}
          >
            <h1 className="font-display text-4xl font-bold leading-tight text-on-surface sm:text-5xl lg:text-6xl xl:text-7xl">
              <MaskLines delayChildren={0.12}>
                <MaskLine>Chấm bài IELTS </MaskLine>
                <MaskLine>
                  <Highlighter delay={0.72}>
                    <em className="italic">miễn phí</em>
                  </Highlighter>
                </MaskLine>
              </MaskLines>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delays.description }}
          >
            <Reveal variant="rise" delay={0} className="mt-5">
              <p className="max-w-[40ch] text-pretty font-body text-base text-on-surface-variant sm:text-lg">
                Writing &amp; Speaking – chấm chuẩn{" "}
                <strong className="font-semibold text-on-surface">
                  4 tiêu chí British Council
                </strong>
                . Được 100.000+ học viên tin dùng.
              </p>
            </Reveal>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delays.buttons }}
          >
            <Reveal variant="rise" delay={0} className="mt-7">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-md bg-primary-container px-6 py-3 font-body text-base font-bold text-on-primary-container shadow-brutal-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:px-7 sm:py-4 sm:text-lg"
                >
                  <PencilIcon className="size-5" />
                  Chấm Writing
                </Link>

                <span
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border-2 border-outline-variant px-6 py-3 font-body text-base font-bold text-on-surface-variant sm:px-7 sm:py-4 sm:text-lg"
                >
                  <MicIcon className="size-5" />
                  Chấm Speaking
                  <span className="rounded-sm bg-surface-container px-1.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-on-primary-fixed sm:text-[11px]">
                    Sắp ra mắt
                  </span>
                </span>
              </div>

              <Link
                href="/#how-it-works"
                className="mt-4 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-on-surface-variant underline-offset-4 transition-colors hover:text-primary hover:underline sm:text-base"
              >
                Cách hoạt động
                <span aria-hidden="true">↓</span>
              </Link>
            </Reveal>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delays.stats }}
          >
            <Reveal variant="rise" delay={0} className="mt-10">
              <dl className="grid max-w-md grid-cols-3 divide-x divide-outline-variant border-y border-outline-variant">
                {STATS.map((stat) => (
                  <div key={stat.label} className="px-3 py-4 first:pl-0 last:pr-0 sm:px-4 sm:py-5">
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <CountUp
                        value={stat.figure}
                        className="block font-display text-2xl font-bold leading-none tabular-nums text-on-surface sm:text-3xl lg:text-[34px]"
                      />
                      <span className="mt-1 block font-body text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant sm:text-xs">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </motion.div>

          {/* Reviews */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: delays.reviews }}
          >
            <Reveal variant="fade" delay={0} className="mt-6">
              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-sm text-on-surface-variant sm:gap-x-6">
                <li className="flex items-center gap-2">
                  <Star className="size-4 text-accent-yellow" />
                  <span className="font-bold text-on-surface">4.9/5</span>
                  <span>8,647 đánh giá</span>
                </li>
                <li className="flex items-center gap-2">
                  <LockIcon className="size-4" />
                  Bảo mật tuyệt đối
                </li>
                <li className="flex items-center gap-2">
                  <GlobeIcon className="size-4" />
                  Chuẩn quốc tế
                </li>
              </ul>
            </Reveal>
          </motion.div>
        </div>

        {/* Cột phải - Scoring Demo */}
        <motion.div
          className="lg:col-span-5 xl:-mr-8"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: delays.scoring }}
        >
          <div className="transform-gpu scale-90 transition-transform lg:scale-95 xl:scale-100">
            <ScoringDemo />
          </div>
        </motion.div>
      </div>
    </section>
  );
}