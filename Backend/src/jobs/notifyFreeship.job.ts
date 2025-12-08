import cron from "node-cron";
import UserModel from "../models/user.model";
import NotificationModel from "../models/notification.model";

cron.schedule("0 9 * * *", async () => {
  console.log("Bắt đầu kiểm tra wishlist để gửi gợi ý freeship...");

  try {
    const users = await UserModel.find().select("_id wishlist updatedAt");

    for (const user of users) {
      const hasWishlist = user.wishlist && user.wishlist.length > 0;
      if (!hasWishlist) continue;

      // Tính mốc 7 ngày trước
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (!user.updatedAt || user.updatedAt > sevenDaysAgo) {
        console.log(`User ${user._id} mới cập nhật wishlist, chưa đủ 7 ngày`);
        continue;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const alreadySent = await NotificationModel.exists({
        userId: user._id,
        title: "Gợi ý mã miễn phí vận chuyển",
        createdAt: { $gte: todayStart },
      });

      if (alreadySent) {
        console.log(`Đã gửi thông báo cho user ${user._id} hôm nay, bỏ qua`);
        continue;
      }

      // Gửi thông báo
      await NotificationModel.create({
        userId: user._id,
        title: "Gợi ý mã miễn phí vận chuyển",
        message:
          "Bạn có sản phẩm trong wishlist hơn 7 ngày. Sử dụng mã FREESHIP để được miễn phí vận chuyển!",
        type: "promotion",
        is_read: false,
      });

      console.log(`Đã gửi thông báo freeship cho user ${user._id}`);
    }

    console.log("Hoàn thành gửi thông báo freeship");
  } catch (error) {
    console.error("Lỗi khi gửi thông báo freeship:", error);
  }
});
