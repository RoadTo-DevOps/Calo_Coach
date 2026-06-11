import mongoose from "mongoose";
import { connectDb } from "../src/config/db.js";
import { ExerciseLog } from "../src/models/ExerciseLog.js";
import { FoodLog } from "../src/models/FoodLog.js";
import { Goal } from "../src/models/Goal.js";
import { User } from "../src/models/User.js";
import { UserProfile } from "../src/models/UserProfile.js";
import { WeightLog } from "../src/models/WeightLog.js";

const DEFAULT_EMAIL = "baophucxz2004@gmail.com";

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const email = argv.slice(2).find((arg) => !arg.startsWith("--")) || DEFAULT_EMAIL;

  return {
    email: email.trim().toLowerCase(),
    deleteUser: args.has("--delete-user")
  };
}

async function deleteManyForUser(Model, userId) {
  const result = await Model.deleteMany({ userId });
  return result.deletedCount || 0;
}

async function main() {
  const { email, deleteUser } = parseArgs(process.argv);

  await connectDb();

  const user = await User.findOne({ email });
  if (!user) {
    console.log(`Không tìm thấy user với email: ${email}`);
    return;
  }

  const userId = user._id;
  const deleted = {
    userProfile: await deleteManyForUser(UserProfile, userId),
    goals: await deleteManyForUser(Goal, userId),
    foodLogs: await deleteManyForUser(FoodLog, userId),
    exerciseLogs: await deleteManyForUser(ExerciseLog, userId),
    weightLogs: await deleteManyForUser(WeightLog, userId),
    user: 0
  };

  if (deleteUser) {
    const result = await User.deleteOne({ _id: userId });
    deleted.user = result.deletedCount || 0;
  }

  console.log(`Đã làm sạch dữ liệu cho: ${email}`);
  console.table(deleted);
  console.log(deleteUser ? "Đã xóa cả tài khoản user." : "Đã giữ lại tài khoản user để đăng nhập test tiếp.");
}

main()
  .catch((error) => {
    console.error("Lỗi khi làm sạch dữ liệu user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
