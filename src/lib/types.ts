/**
 * Trip data model — 단일 KV key "trip:current" 에 JSON blob 으로 저장.
 * Admin 에서 부분 수정 시 server 가 read-modify-write.
 */
export type ID = string;

export type FamilyColor = "ink" | "dancheong" | "maple" | "gold" | "celadon" | "plum";

export interface ScheduleItem {
  id: ID;
  day: 1 | 2;
  time?: string;
  title: string;
  description?: string;
  location?: string;
}

export interface FamilyMember {
  id: ID;
  name: string;
  note?: string;
}

export type RsvpStatus = "confirmed" | "tentative" | "pending";

export interface Family {
  id: ID;
  /** 가족 라벨 (예: "할머니", "혜숙네") */
  label: string;
  /** 색상 토큰 */
  color?: FamilyColor;
  /** 시드 시점 인원 — 멤버 이름이 비어 있어도 표시 */
  headcount: number;
  members: FamilyMember[];
  /** 도착 시간 메모 */
  arrivalNote?: string;
  /** 가족 사진 URL — 없으면 라벨 이니셜 아바타 */
  photoUrl?: string;
  /** 도착 RSVP 상태 — 기본 pending */
  rsvp?: RsvpStatus;
  /** 마지막 RSVP 토글한 사람 이름 */
  rsvpBy?: string;
  /** RSVP 마지막 변경 timestamp (ms) */
  rsvpAt?: number;
}

export interface ChecklistItem {
  id: ID;
  text: string;
  checked: boolean;
  assignedTo?: ID;
  toggledBy?: string;
  updatedAt?: number;
}

export interface GroceryItem {
  id: ID;
  text: string;
  /** 담당 가족 id */
  assignedFamilyId?: ID;
  /** 예상 비용 (원) */
  estimatedCost?: number;
  /** 실제 사용 비용 (원) */
  actualCost?: number;
  /** 구매 완료 여부 */
  purchased: boolean;
  /** 자유 비고 (브랜드, 수량 등) */
  note?: string;
}

export interface DuePayment {
  id: ID;
  familyId: ID;
  amount: number;
  paidAt?: string; // YYYY-MM-DD
  note?: string;
}

export interface Expense {
  id: ID;
  title: string;
  amount: number;
  /** 결제한 가족 id (선택) */
  paidByFamilyId?: ID;
  category?: "식료품" | "숙박" | "교통" | "기타";
  occurredAt?: string;
  note?: string;
}

export interface Budget {
  /** 인당 권장 회비 (선택) */
  perPerson?: number;
  /** 자유 메모 (정산 규칙 등) */
  note?: string;
  payments: DuePayment[];
  expenses: Expense[];
}

export interface Place {
  name: string;
  address?: string;
  mapUrl?: string;
  /** 카카오/네이버 임베드 src — 있으면 우선 사용 */
  embedSrc?: string;
  /** 좌표 — 있으면 OSM iframe 자동 렌더 (key 없이) */
  lat?: number;
  lng?: number;
}

export interface Trip {
  title: string;
  subtitle?: string;
  startsAt: string;
  endsAt: string;
  hero: {
    headline: string;
    sub?: string;
  };
  place: Place;
  schedule: ScheduleItem[];
  families: Family[];
  checklist: ChecklistItem[];
  groceries: GroceryItem[];
  budget: Budget;
  updatedAt: number;
}

/**
 * 시드 데이터 — KV 첫 부팅 시 1회만 들어가고, 이후 admin 수정이 권위.
 * 천진암로 834-18 일대 좌표는 근사값 (admin 에서 정밀 조정 가능).
 */
export const DEFAULT_TRIP: Trip = {
  title: "우리 가족 1박 2일",
  subtitle: "어반스트림에서",
  startsAt: "2026-05-24T15:00:00+09:00",
  endsAt: "2026-05-25T15:00:00+09:00",
  hero: {
    headline: "오랜만에, 한자리에.",
    sub: "다 같이 모여 밥 먹고, 게임 하고, 산책 한 번 합시다.",
  },
  place: {
    name: "어반스트림",
    address: "경기 광주시 퇴촌면 천진암로 834-18",
    mapUrl: "https://map.kakao.com/?q=경기%20광주시%20퇴촌면%20천진암로%20834-18",
    lat: 37.485,
    lng: 127.31,
  },
  schedule: [
    {
      id: "s1",
      day: 1,
      time: "15:00",
      title: "체크인 · 입실",
      description:
        "어반스트림 도착, 짐 풀고 한숨 돌리기. 바닥은 보일러로 따뜻하고, 침대는 퀸 2개씩 · 샴푸·린스·바디워시·핸드워시는 숙소에 구비돼 있어요.",
    },
    {
      id: "s2",
      day: 1,
      time: "18:30",
      title: "저녁 · 바베큐",
      description:
        "다 같이 굽는 바베큐 한 상. 고기·쌈채소·김치·반찬·음료 모두 가족별 분담으로 준비합니다.",
    },
    {
      id: "s3",
      day: 1,
      time: "20:30",
      title: "가족 게임 시간",
      description: "보드게임 · 마피아 · 무엇이든",
    },
    {
      id: "s4",
      day: 2,
      time: "09:00",
      title: "아침 · 간단식",
      description: "햇반·컵라면·라면 — 각자 취향껏",
    },
    {
      id: "s5",
      day: 2,
      time: "12:30",
      title: "점심 · 외부 식당",
      description: "근처 맛집에서 (장소 미정)",
    },
    {
      id: "s6",
      day: 2,
      time: "14:00",
      title: "산책 · 마무리",
      description: "천진암 둘레 산책",
    },
  ],
  families: [
    {
      id: "fam-grandma",
      label: "할머니",
      color: "gold",
      headcount: 1,
      members: [],
      rsvp: "pending",
    },
    {
      id: "fam-hyesook",
      label: "혜숙 큰언니네",
      color: "celadon",
      headcount: 3,
      members: [{ id: "m-hyesook", name: "김혜숙", note: "큰언니" }],
      rsvp: "pending",
    },
    {
      id: "fam-jeongha",
      label: "정하 작은언니네",
      color: "dancheong",
      headcount: 6,
      members: [{ id: "m-jeongha", name: "김정하", note: "작은언니" }],
      rsvp: "pending",
    },
    {
      id: "fam-geumja",
      label: "금자네",
      color: "ink",
      headcount: 1,
      members: [],
      rsvp: "pending",
    },
    {
      id: "fam-jeongan",
      label: "정안 오빠네",
      color: "plum",
      headcount: 4,
      members: [{ id: "m-jeongan", name: "김정안", note: "오빠" }],
      rsvp: "pending",
    },
    {
      id: "fam-jeonghee",
      label: "정희네",
      color: "maple",
      headcount: 5,
      members: [{ id: "m-jeonghee", name: "김정희" }],
      rsvp: "pending",
    },
  ],
  checklist: [
    { id: "c1", text: "치약 · 칫솔", checked: false },
    { id: "c2", text: "개인 수건", checked: false },
    { id: "c3", text: "개인 화장품", checked: false },
    { id: "c4", text: "침낭 (있는 분만)", checked: false },
    { id: "c5", text: "이불 1세트씩", checked: false },
    { id: "c6", text: "고기 구이 세팅 (3만 원) 이용 여부 정하기", checked: false },
    { id: "c7", text: "차량 분담 정하기", checked: false },
    { id: "c8", text: "보드게임 · 카드 챙기기", checked: false },
  ],
  groceries: [
    {
      id: "g-hyesook",
      text: "혜숙 큰언니 — 채소 한 묶음",
      note: "양파(깐 것 조금) · 오이 · 당근 · 아삭이 고추 · 상추 · 깻잎",
      assignedFamilyId: "fam-hyesook",
      purchased: false,
    },
    {
      id: "g-jihye",
      text: "지혜 — 햇반 · 컵라면",
      note: "아침용",
      purchased: false,
    },
    {
      id: "g-jeongha",
      text: "정하 작은언니 — 김치 · 양념 · 주방 도구",
      note: "열무김치 · 시래기 된장국 · 쌈장 · 소금 · 키친타올 · 목장갑 · 하얀 그릇 10개",
      assignedFamilyId: "fam-jeongha",
      purchased: false,
    },
    {
      id: "g-eunbyul",
      text: "은별 — 음료 · 간식 · 물티슈",
      note: "물티슈 1~2개 · 과자 · 음료 · 물 · 수박",
      purchased: false,
    },
    {
      id: "g-jeongan",
      text: "정안 오빠 — 일회용품 · 양념",
      note: "일회용 접시 · 숟가락/젓가락 · 후추 · 일회용 장갑 · 비닐 · 깐마늘 · 쌈무",
      assignedFamilyId: "fam-jeongan",
      purchased: false,
    },
    {
      id: "g-jeonghee",
      text: "정희 — 고기 · 김치 · 반찬",
      note: "목삼겹 · 삼겹 · 소세지 · 새우 · 묵은지 · 갓김치 · 양파 장아찌",
      assignedFamilyId: "fam-jeonghee",
      purchased: false,
    },
    {
      id: "g-sunwoo",
      text: "선우 — 소꼬리",
      purchased: false,
    },
  ],
  budget: {
    perPerson: 30000,
    note: "1인당 3만 원 기준 · 잔액은 마지막 날 정산",
    payments: [],
    expenses: [],
  },
  updatedAt: Date.now(),
};
