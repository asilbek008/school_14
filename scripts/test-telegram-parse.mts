// Tests for supabase/functions/telegram-sync/parse.ts:
//   node --experimental-strip-types scripts/test-telegram-parse.mts
import assert from "node:assert/strict";
import { classify, findDate, imageSize, oldestPostId, parseChannelPage, postPhotos, postVideos, slugFor, tidyTitle } from "../supabase/functions/telegram-sync/parse.ts";

const post = (id: number, inner: string, date = "2026-09-20T05:00:00+00:00") => `
<div class="tgme_widget_message_wrap js-widget_message_wrap"><div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="maktab14/${id}" data-view="x">
  <div class="tgme_widget_message_user"><a href="https://t.me/maktab14"><i class="tgme_widget_message_user_photo bgcolor4"><img src="https://cdn1.telesco.pe/file/avatar.jpg"></i></a></div>
  <div class="tgme_widget_message_bubble">${inner}
  <div class="tgme_widget_message_footer compact js-message_footer"><div class="tgme_widget_message_info short js-message_info"><span class="tgme_widget_message_views">120</span><span class="tgme_widget_message_meta"><a class="tgme_widget_message_date" href="https://t.me/maktab14/${id}"><time datetime="${date}" class="time">10:00</time></a></span></div></div>
  </div></div></div>`;

const html = `<html><body>
${post(10, `<a class="tgme_widget_message_photo_wrap 1 2" href="https://t.me/maktab14/10" style="width:800px;background-image:url('https://cdn4.telesco.pe/file/photo10.jpg')"><div class="tgme_widget_message_photo"></div></a>
<div class="tgme_widget_message_text js-message_text" dir="auto"><b>Ustozlar kuni bayrami</b> <i class="emoji" style="background-image:url('//telegram.org/img/emoji/40/F09F8E89.png')"><b>🎉</b></i><br/><br/>1-oktabr kuni soat 10:00 da maktab faollar zalida bayram tadbiri bo&#39;lib o&#8216;tadi.<br/>📍 Maktab faollar zali<br/><br/><a href="?q=%23tadbir">#tadbir</a> <a href="?q=%23bayram">#bayram</a></div>`)}
${post(11, `<div class="tgme_widget_message_text js-message_text" dir="auto">Viloyat olimpiadasida o‘quvchimiz 1-o‘rinni egalladi!<br/>Tabriklaymiz &amp; omad! Ustoziga va ota-onasiga rahmat.<br/><a href="?q=%23yutuq">#yutuq</a></div>`)}
${post(12, `<a class="tgme_widget_message_video_player" href="https://t.me/maktab14/12"><i class="tgme_widget_message_video_thumb" style="background-image:url('https://cdn4.telesco.pe/file/thumb12.jpg')"></i></a><div class="tgme_widget_message_text js-message_text" dir="auto">Sport musobaqasi bo‘ladi, sanasi keyinroq e’lon qilinadi. Ishtirokchilar ro‘yxati sinf rahbarlarida. #sport</div>`)}
${post(13, `<div class="tgme_widget_message_text js-message_text" dir="auto">Ichki xabar #saytga_emas</div>`)}
${post(14, `<a class="tgme_widget_message_photo_wrap" href="https://t.me/maktab14/14" style="background-image:url('https://cdn4.telesco.pe/file/only.jpg')"></a>`)}
${post(15, `<div class="tgme_widget_message_text js-message_text" dir="auto">Ota-onalar yig‘ilishi<br/>12.01.2027 soat 17.30 da. #e’lon #tadbir</div>`)}
<div class="tgme_widget_message_wrap js-widget_message_wrap"><div class="tgme_widget_message service_message js-widget_message" data-post="maktab14/1"><time datetime="2026-01-01T00:00:00+00:00"></time></div></div>
</body></html>`;

// Image headers, so two renditions of the same photo can be compared by size before one is kept.
// A real JPEG from the channel (its APP0/APP1 segments come before the frame header), a PNG and a WebP.
const jpeg = (w: number, h: number) =>
  new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, // APP0 (JFIF)
    0xff, 0xdb, 0x00, 0x05, 0, 1, 2, // DQT, skipped
    0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 3, // SOF0
    1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
  ]);
assert.deepEqual(imageSize(jpeg(1280, 960)), { width: 1280, height: 960 }, "JPEG frame header after APP0/DQT");
assert.deepEqual(imageSize(jpeg(800, 600)), { width: 800, height: 600 }, "the preview rendition");
const png = new Uint8Array(30);
png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
png.set([0, 0, 0x04, 0x00, 0, 0, 0x03, 0x00], 16); // 1024 x 768
assert.deepEqual(imageSize(png), { width: 1024, height: 768 }, "PNG IHDR");
const webp = new Uint8Array(32);
webp.set([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58], 0); // RIFF/WEBP/VP8X
webp.set([0x7f, 0x02, 0x00, 0xdf, 0x01, 0x00], 24); // 640 x 480 (stored minus one)
assert.deepEqual(imageSize(webp), { width: 640, height: 480 }, "WebP VP8X");
assert.equal(imageSize(new Uint8Array([1, 2, 3, 4])), null, "not an image");
assert.equal(imageSize(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 0, 0, 0, 0, 0, 0, 0])), null, "JPEG with no frame header");

const posts = parseChannelPage(html);
assert.deepEqual(posts.map((p) => p.id), [10, 11, 12, 13, 14, 15]);
assert.deepEqual(posts[0].images, ["https://cdn4.telesco.pe/file/photo10.jpg"], "photo, not the avatar");
assert.deepEqual(posts[2].images, ["https://cdn4.telesco.pe/file/thumb12.jpg"], "video thumb fallback");
assert.deepEqual(posts[0].photoIds, [10]);
assert.deepEqual(posts[2].videos, [{ id: 12, url: null, thumb: "https://cdn4.telesco.pe/file/thumb12.jpg", duration: null }], "video of a post");
assert.deepEqual(posts[0].videos, [], "a photo post has no video");

// Videos as the channel really serves them: a small one carries its file, a long one only says
// "Media is too big"; an album numbers each video like a photo.
const videoBlock = `<a class="tgme_widget_message_video_player js-message_video_player" href="https://t.me/maktab14/31?single"><i class="tgme_widget_message_video_thumb" style="background-image:url('https://cdn4.telesco.pe/file/t31.jpg')"></i>
  <video src="https://cdn4.telesco.pe/file/689667b17e.mp4?token=abc" class="tgme_widget_message_video js-message_video"></video>
  <time class="message_video_duration js-message_video_duration">0:42</time></a>
<a class="tgme_widget_message_video_player not_supported js-message_video_player" href="https://t.me/maktab14/32?single"><i class="tgme_widget_message_video_thumb" style="background-image:url('https://cdn4.telesco.pe/file/t32.jpg')"></i>
  <time class="message_video_duration js-message_video_duration">1:02:05</time>
  <div class="message_media_not_supported_label">Media is too big</div></a>`;
assert.deepEqual(postVideos(videoBlock, 30), [
  { id: 31, url: "https://cdn4.telesco.pe/file/689667b17e.mp4?token=abc", thumb: "https://cdn4.telesco.pe/file/t31.jpg", duration: 42 },
  { id: 32, url: null, thumb: "https://cdn4.telesco.pe/file/t32.jpg", duration: 3725 },
], "album videos: file when small, link when too big");
// A single video's player links to the post itself, so the post number is its id.
assert.deepEqual(
  postVideos(`<a class="tgme_widget_message_video_player" href="https://t.me/maktab14/40"><i class="tgme_widget_message_video_thumb" style="background-image:url('//cdn4.telesco.pe/file/t40.jpg')"></i></a>`, 40),
  [{ id: 40, url: null, thumb: "https://cdn4.telesco.pe/file/t40.jpg", duration: null }],
);
assert.deepEqual(postVideos("<div>no video here</div>", 1), []);
const album = `<div class="tgme_widget_message_grouped_wrap"><a class="tgme_widget_message_photo_wrap grouped_media_wrap blured js-message_photo" style="" href="https://t.me/maktab14/21" x><i></i></a>
<a class="tgme_widget_message_photo_wrap grouped_media_wrap blured js-message_photo" style="left:0px;width:225px;background-image:url('https://cdn4.telesco.pe/file/a.jpg')" data-ratio="1.33" href="https://t.me/maktab14/20?single"></a>
<a class="tgme_widget_message_photo_wrap 52 12" href="https://t.me/maktab14/21?single" style="width:226px;background-image:url('https://cdn4.telesco.pe/file/b.jpg')"></a></div>`;
assert.deepEqual(postPhotos(album), [{ id: 20, url: "https://cdn4.telesco.pe/file/a.jpg" }, { id: 21, url: "https://cdn4.telesco.pe/file/b.jpg" }], "album photo ids");
assert.ok(posts[0].text.includes("bo'lib o‘tadi"), "entities decoded");
assert.ok(posts[0].text.includes("🎉"));

const c10 = classify(posts[0]);
assert.equal(c10.kind, "event");
if (c10.kind === "event") {
  assert.equal(c10.title, "Ustozlar kuni bayrami", "edge emoji dropped");
  assert.equal(c10.startsAt, "2026-10-01T05:00:00.000Z", "10:00 Tashkent");
  assert.equal(c10.allDay, false);
  assert.equal(c10.location, "Maktab faollar zali");
  assert.equal(c10.category, "maktab", "first event tag wins");
  assert.ok(!c10.description.includes("#"), "hashtags removed");
}
const c11 = classify(posts[1]);
assert.equal(c11.kind, "news");
if (c11.kind === "news") {
  assert.equal(c11.category, "yutuq");
  assert.equal(c11.title, "Viloyat olimpiadasida o‘quvchimiz 1-o‘rinni egalladi!");
  assert.equal(c11.body, "Tabriklaymiz & omad! Ustoziga va ota-onasiga rahmat.");
}
const c12 = classify(posts[2]);
assert.ok(c12.kind === "news" && c12.category === "tadbir", "event tag without a date → news/tadbir");
assert.deepEqual(classify(posts[3]), { kind: "skip", reason: "#saytga_emas" });
assert.equal(classify(posts[4]).kind, "skip", "photo only");
const c15 = classify(posts[5]);
assert.ok(c15.kind === "event" && c15.startsAt === "2027-01-12T12:30:00.000Z", JSON.stringify(c15));

// The school channel's style: emoji-framed ALL-CAPS titles, no hashtags.
assert.equal(tidyTitle("🌷 USTOZ — QALBLARGA ZIYO BERUVCHI BUYUK ZOT! 🌷"), "Ustoz — qalblarga ziyo beruvchi buyuk zot!");
assert.equal(tidyTitle("🌟 YUTUQ — E’TIROF ETILDI! 🇬🇧🏆"), "Yutuq — e’tirof etildi!");
assert.equal(tidyTitle("👨‍👩‍👧 1-SINF O‘QUVCHILARI OTA-ONALARI BILAN YIG‘ILISH"), "1-sinf o‘quvchilari ota-onalari bilan yig‘ilish");
assert.equal(tidyTitle("Ota-onalar yig‘ilishi"), "Ota-onalar yig‘ilishi");
assert.equal(tidyTitle("🏃 “BESH TASHABBUS” — SPORT BILAN SOG‘LOM AVLOD!"), "“Besh tashabbus” — sport bilan sog‘lom avlod!");
const long = "\n\nQiziriq tumani 14-sonli maktabida bayram tadbiri tashkil etildi. O‘quvchilar she’rlar va qo‘shiqlar bilan chiqdi.";
const at = (text: string) => classify({ id: 1, date: "2026-09-22T12:00:00Z", text, images: [] });
assert.deepEqual(at("🌟 YUTUQ — E’TIROF ETILDI! 🇬🇧🏆" + long), { kind: "news", title: "Yutuq — e’tirof etildi!", body: long.trim(), category: "yutuq" });
assert.equal((at("🍎 MEHRJON BAYRAMI" + long) as { category: string }).category, "tadbir");
assert.equal((at("🏅 YANA BIR YUKSAK NATIJA!" + long) as { category: string }).category, "yutuq");
assert.equal((at("E’LON!" + long) as { category: string }).category, "elon");
assert.deepEqual(at("\"Ilmdan boshqa najot yoʻq va boʻlmagay\"\nImom Al-Buxoriy"), { kind: "skip", reason: "juda qisqa" });
assert.equal(at("Ertaga darslar yo‘q #sayt").kind, "news", "#sayt keeps a short post");
assert.equal(oldestPostId('<a class="tme_messages_more js-messages_more" data-before="2963"></a>'), 2963);

// Dates
const posted = new Date("2026-09-20T05:00:00Z");
assert.equal(findDate("25 декабря в 18:00", posted)?.startsAt, "2026-12-25T13:00:00.000Z");
assert.equal(findDate("15-mayda sport kuni", posted)?.startsAt, "2027-05-14T19:00:00.000Z", "past date → next year, all day");
assert.equal(findDate("15-mayda sport kuni", posted)?.allDay, true);
assert.equal(findDate("2027-yil 3-mart", posted)?.startsAt, "2027-03-02T19:00:00.000Z");
assert.equal(findDate("31-noyabr", posted), null, "no such day");
assert.equal(findDate("5 maydonda", posted), null, "maydon is not may");
assert.equal(findDate("12.05 da uchrashuv", posted), null, "dd.mm without a year is not a date");

assert.equal(slugFor("Ustozlar kuni bayrami 🎉", 10), "ustozlar-kuni-bayrami-tg10");
assert.equal(slugFor("День учителя", 7), "telegram-7");

console.log("telegram parse: all tests passed");
