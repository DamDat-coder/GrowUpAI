import newsModel from "../models/news.model";
import UserModel from "../models/user.model";
import NotificationModel from "../models/notification.model";

export const autoPublishNews = async () => {
  try {
    const now = new Date();
    now.setHours(now.getHours() + 7); 
    const newsToPublish = await newsModel
      .find({ is_published: false, published_at: { $lte: now } })
      .select("title _id")
      .lean();

    if (newsToPublish.length === 0) {
      return;
    }

    const newsIds = newsToPublish.map((news) => news._id);
    const result = await newsModel.updateMany(
      { _id: { $in: newsIds } },
      { $set: { is_published: true } }
    );

    console.log(
      "[AutoPublish] Đã đăng",
      result.modifiedCount,
      "bài:",
      newsToPublish.map((news) => news.title).join(", ")
    );

    // Gửi thông báo
    setImmediate(async () => {
      try {
        const users = await UserModel.find({}).select("_id").lean();
        const notifications = newsToPublish.flatMap((news) =>
          users.map((user) => ({
            userId: user._id,
            title: "Tin tức mới từ Shop For Real",
            message: `Tin tức "${news.title}" vừa được đăng, xem ngay nhé!`,
            type: "news",
            isRead: false,
            link: `/posts/${news._id}`,
          }))
        );
        await NotificationModel.insertMany(notifications);
        console.log(`[AutoPublish] Đã gửi ${notifications.length} thông báo.`);
      } catch (notifyErr) {
        console.error("[AutoPublish] Gửi thông báo thất bại:", notifyErr);
      }
    });
  } catch (error) {
    console.error("[AutoPublish] Lỗi khi tự động đăng tin tức:", error);
  }
};