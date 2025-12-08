import Image from "next/image";

export default function Header() {
  return (
    <header className="absolute top-4 left-0 right-0 gitflex justify-center z-20">
      <div className="flex items-center justify-center gap-3 px-6 py-2 bg-white/70 dark:bg-[#252525] backdrop-blur-md rounded-full shadow-sm font-semibold border border-gray-100">
        <div className=" p-1 rounded-lg">
          <Image
            src="/Core/logo.png"
            width={50}
            height={50}
            alt="logo"
            className="p-1 rounded-lg mix-blend-mode:multiply"
          />
        </div>{" "}
        GrowUp AI
      </div>

      <button className="absolute right-6 px-4 py-2 bg-black text-white rounded-xl text-sm shadow">
        Tìm hiểu thêm
      </button>
    </header>
  );
}
