/** Extend the existing native competition-cover layout with the three images
 * explicitly supplied for public use on 2026-10-07. No PPT exports are read.
 * NODE_PATH=<bundled dependencies>/node_modules node render_lowcom_cover.cjs
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = __dirname;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
(async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root,'source/project-previews/inputs/lowcom/sources.json')));
  const team = JSON.parse(await fs.readFile(path.join(root,'source/competition-teams.json'))).lowcomProjectCard;
  const images = {};
  for (const [name, record] of Object.entries(manifest)) {
    const data = await fs.readFile(path.join(root,record.path));
    if (crypto.createHash('sha256').update(data).digest('hex') !== record.sha256) throw Error(`Input changed: ${name}`);
    images[name] = `data:image/png;base64,${(await sharp(data).png().toBuffer()).toString('base64')}`;
  }
  const outputs = [];
  for (const lang of ['zh','en']) {
    const zh = lang === 'zh';
    const content = ['<rect width="1080" height="810" fill="#fff"/>'];
    const image = (name,x,y,w,h) => content.push(`<image href="${images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`);
    const text = (value,x,y,size,opts='') => content.push(`<text x="${x}" y="${y}" font-size="${size}" ${opts}>${esc(value)}</text>`);
    image('hust',40,30,250,72);
    image('mcsp',814,36,105,62);
    image('innovation',950,28,86,78);
    if (zh) text('凌云睿通：基于波束跟踪的低空通信信号增强系统',40,180,41,'font-weight="700"');
    else {
      text('Lingyun Ruitong: Beam-Tracking-Based',40,158,40,'font-weight="700"');
      text('Low-Altitude Communication Signal Enhancement System',40,205,34,'font-weight="700"');
    }
    const people = [...team.members,...team.advisors];
    for (const [row, group] of [people.slice(0,6),people.slice(6)].entries()) {
      const size = zh ? 23 : 20;
      let restore = false;
      const spans = group.map((person,index) => {
        const mark = person.zh === team.leader ? '‡' : team.advisors.includes(person) ? '*' : '';
        const separator = index ? `<tspan dy="${restore?size*.32:0}" font-size="${size}"> · </tspan>` : '';
        restore = Boolean(mark);
        return `${separator}<tspan ${person.zh==='谢秋实'?'text-decoration="underline"':''}>${esc(person[lang])}</tspan>${mark?`<tspan dy="-${size*.32}" font-family="Arial" font-size="${size*.72}">${mark}</tspan>`:''}`;
      }).join('');
      content.push(`<text xml:space="preserve" x="40" y="${zh?250+row*37:252+row*34}" font-size="${size}">${spans}</text>`);
    }
    content.push('<path d="M40 325H1040" stroke="#dce3e7" stroke-width="1.5"/>');
    image('radiation',40,354,305,295);
    image('tracking',386,348,322,305);
    image('array',748,354,292,295);
    const labels = zh ? ['波束转向','波束追踪','模拟移相器结构'] : ['Beam steering','Beam tracking','Simulated phase shifter structure'];
    labels.forEach((label,index)=>text(label,[192,547,894][index],699,zh?25:24,'font-weight="700" text-anchor="middle"'));
    text(zh?'动态可重构超表面  →  波束跟踪  →  定向信号增强':'Reconfigurable metasurface  →  Beam tracking  →  Signal enhancement',540,764,zh?25:23,'fill="#526572" text-anchor="middle"');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960" viewBox="0 0 1080 810"><g font-family="Times New Roman, Microsoft YaHei, PingFang SC, serif" fill="#233946">${content.join('')}</g></svg>`;
    const stem = path.join(root,'source/project-previews/low-altitude-communication',`cover-${lang}`);
    await fs.mkdir(path.dirname(stem),{recursive:true});
    await fs.writeFile(stem+'.svg',svg);
    await sharp(Buffer.from(svg)).flatten({background:'white'}).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(stem+'.jpg');
    outputs.push({lang,path:path.relative(root,stem+'.jpg'),bytes:(await fs.stat(stem+'.jpg')).size});
  }
  console.log(JSON.stringify({covers:outputs}));
})();
