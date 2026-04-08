export default function Hero() {
  return (
    <div className="w-[80%] tablet:w-[90%] laptop:w-full flex flex-col items-center justify-center mt-24">
      <h2 className="text-2xl laptop:text-3xl font-semibold text-gray-900 dark:text-white">
        Xin chào
      </h2>

      <h1 className="text-2xl laptop:text-4xl font-bold bg-[#0E7C45] text-transparent bg-clip-text mt-2 pb-2">
        Tôi có thể giúp gì được cho bạn
      </h1>
    </div>
  );
}
