import { PrismaClient } from "@prisma/client";
import { getSuggestedNextStep } from "../lib/status";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.note.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.project.deleteMany();

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  };

  await prisma.project.create({
    data: {
      companyName: "Công ty A",
      projectName: "Website thương mại điện tử",
      status: "New",
      nextStep: getSuggestedNextStep("New"),
      firstContactDate: daysAgo(5),
      contacts: {
        create: [{ name: "Nguyễn Văn An", phone: "0901111111", email: "an.nguyen@congtya.com", position: "Giám đốc", isPrimary: true }],
      },
      notes: {
        create: [{ content: "Khách hàng liên hệ qua Facebook, quan tâm website bán hàng online." }],
      },
    },
  });

  await prisma.project.create({
    data: {
      companyName: "Công ty B",
      projectName: "Hệ thống quản lý nhân sự",
      status: "Đã demo",
      nextStep: getSuggestedNextStep("Đã demo"),
      firstContactDate: daysAgo(20),
      contacts: {
        create: [
          { name: "Trần Thị Bình", phone: "0902222222", email: "binh.tran@congtyb.com", position: "Trưởng phòng Nhân sự", isPrimary: true },
          { name: "Lê Văn Cường", phone: "0902222233", email: "cuong.le@congtyb.com", position: "IT Manager", isPrimary: false, note: "Phụ trách kỹ thuật, cần CC khi gửi tài liệu." },
        ],
      },
      notes: {
        create: [
          { content: "Đã demo bản dùng thử cho team HR, phản hồi tích cực." },
          { content: "Khách yêu cầu thêm module chấm công bằng khuôn mặt." },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      companyName: "Công ty C",
      projectName: "Ứng dụng đặt lịch khám bệnh",
      status: "Đã gửi báo giá",
      nextStep: getSuggestedNextStep("Đã gửi báo giá"),
      firstContactDate: daysAgo(35),
      contacts: {
        create: [{ name: "Phạm Thị Dung", phone: "0903333333", email: "dung.pham@congtyc.com", position: "CEO", isPrimary: true }],
      },
      notes: {
        create: [{ content: "Đã gửi báo giá v1, khách đang xem xét và so sánh với 2 đối tác khác." }],
      },
    },
  });

  await prisma.project.create({
    data: {
      companyName: "Công ty D",
      projectName: "Phần mềm quản lý kho",
      status: "Đã gửi hợp đồng",
      nextStep: getSuggestedNextStep("Đã gửi hợp đồng"),
      firstContactDate: daysAgo(50),
      contacts: {
        create: [{ name: "Hoàng Văn Em", phone: "0904444444", email: "em.hoang@congtyd.com", position: "Quản lý vận hành", isPrimary: true }],
      },
      notes: {
        create: [{ content: "Đã gửi hợp đồng bản chính thức, chờ phòng pháp lý của khách review." }],
      },
    },
  });

  await prisma.project.create({
    data: {
      companyName: "Công ty E",
      projectName: "Hệ thống CRM nội bộ",
      status: "Ký hợp đồng",
      nextStep: getSuggestedNextStep("Ký hợp đồng"),
      firstContactDate: daysAgo(70),
      contractSignedAt: daysAgo(2),
      contacts: {
        create: [{ name: "Vũ Thị Giang", phone: "0905555555", email: "giang.vu@congtye.com", position: "Phó Giám đốc", isPrimary: true }],
      },
      notes: {
        create: [{ content: "Đã ký hợp đồng chính thức. Chuẩn bị bàn giao cho team triển khai." }],
      },
    },
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
