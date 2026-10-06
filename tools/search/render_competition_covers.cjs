/** Render native SVG covers using unchanged project photographs, logos and plots.
 * Run with Node and sharp installed. Missing originals are fetched from the
 * provenance manifest and checked by SHA-256. No image content is generated.
 */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = __dirname;
const source = path.join(root, 'source/project-previews');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
(async () => {
  const teams = JSON.parse(await fs.readFile(path.join(root,'source/competition-teams.json')));
  const sources = JSON.parse(await fs.readFile(path.join(source,'inputs/cover-sources.json')));
  const images = {};
  for (const [name, record] of Object.entries(sources)) {
    const file = path.join(root,record.path);
    let data;
    try { data = await fs.readFile(file); }
    catch {
      if (!record.url) throw new Error(`User-selected original must be present: ${record.path}`);
      const response = await fetch(record.url);
      if (!response.ok) throw new Error(`Original unavailable: ${record.url}`);
      data = Buffer.from(await response.arrayBuffer());
      await fs.mkdir(path.dirname(file),{recursive:true});
      await fs.writeFile(file,data);
    }
    if (crypto.createHash('sha256').update(data).digest('hex') !== record.sha256) throw new Error(`Original changed: ${name}`);
    // Lossless format conversion only, for portable SVG image decoding.
    images[name] = `data:image/png;base64,${(await sharp(data).png().toBuffer()).toString('base64')}`;
  }
  function cover(project, lang) {
    const intel = project === 'intelcup-2026';
    const c = project === 'nuedc-c';
    const height = intel ? 720 : 810;
    const target = intel ? [1080,720] : [1280,960];
    const zh = lang === 'zh';
    const team = teams[intel?'projectCard':c?'nuedcProjectCard':'embeddedProjectCard'];
    const content = [`<rect width="1080" height="${height}" fill="white"/>`];
    const text = (value,x,y,size=26,opts='') => {
      let restore = false;
      const runs = Array.isArray(value) ? value : [{value:String(value)}];
      const spans = runs.map(run => String(run.value).split(/([†‡*])/).filter(Boolean).map(chunk => {
        const dy=restore?size*.32:0; restore=false;
        const mark = /^[†‡]$/.test(chunk);
        if (chunk==='*' || mark) { restore=true; return `<tspan dy="${dy-size*.32}" font-family="${mark?'Arial':'Times New Roman'}" font-size="${size*(mark ? .72 : .65)}" font-weight="400">${esc(chunk)}</tspan>`; }
        return `<tspan dy="${dy}" font-size="${size}" ${mark?'font-family="Arial" font-weight="400"':''} ${run.underline&&!mark?'text-decoration="underline"':''}>${esc(chunk)}</tspan>`;
      }).join('')).join('');
      content.push(`<text x="${x}" y="${y}" font-size="${size}" ${opts}>${spans}</text>`);
    };
    const image = (name,x,y,w,h) => content.push(`<image href="${images[name]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`);
    image('hust',40,30,250,72);
    image(intel?'intel-logo':c?'nuedc-logo':'embedded-logo',intel?935:918,28,intel?95:122,76);
    if (!intel && !c) image('renesas',768,38,122,54);
    const titles = intel ? (zh?['智驭低空枢纽（无人机地面站系统）']:['Intelligent Low-Altitude Hub','(UAV Ground Station System)']) :
      c ? (zh?['基于无线通信的数字钥匙实验系统']:['Wireless Digital Key Experimental System']) :
      (zh?['基于 RA MCU 嵌入式处理平台的智能烟雾检测系统','与自适应 AI 阈值优化算法']:
      ['Intelligent Smoke Detection System and Adaptive AI','Threshold Optimization on an RA MCU Embedded Platform']);
    const titleSize = (!intel&&!c) ? (zh?36:34) : (zh?45:(intel?42:39));
    titles.forEach((line,index)=>text(line,40,titles.length===1?190:166+index*49,titleSize,'font-weight="700"'));
    const roster=[];
    [...team.members,...team.advisors].forEach((person,index)=>{
      if(index) roster.push({value:' · '});
      roster.push({value:person[lang],underline:person.zh==='谢秋实'});
      roster.push({value:person.zh===team.leader?'‡':team.advisors.includes(person)?'*':''});
    });
    text(roster,40,270,zh?26:24);
    content.push('<path d="M40 320H1040" stroke="#dce3e7" stroke-width="1.5"/>');
    if (intel) {
      image('dk2500',50,346,285,220);
      image('drone',370,350,295,212);
      image('ground-station',720,348,315,215);
      ['Intel DK-2500',zh?'低空巡检无人机':'Patrol UAV',zh?'地面站软件':'Ground station software'].forEach((label,i)=>text(label,[192,518,877][i],606,25,'text-anchor="middle" font-weight="700"'));
      text(zh?'多模态交互  →  任务规划  →  自主巡检  →  状态回传':'Multimodal interaction  →  Mission planning  →  Patrol  →  Telemetry',540,671,23,'text-anchor="middle" fill="#526572"');
    } else if(c) {
      image('c-system',45,348,470,315);
      image('c-software',560,350,480,310);
      text(zh?'完整系统实物':'Complete system hardware',280,688,25,'text-anchor="middle" font-weight="700"');
      text(zh?'运行界面':'Running interface',800,688,25,'text-anchor="middle" font-weight="700"');
      text(zh?'定位  →  身份判定  →  区域判定  →  门锁控制':'Position  →  Identity  →  Zone  →  Lock control',540,754,25,'text-anchor="middle" fill="#526572"');
    } else {
      image('ra6m5-board',45,348,470,302);
      image('embedded-curve',565,359,470,282);
      text(zh?'RA6M5 实物板卡':'RA6M5 development board',280,686,25,'text-anchor="middle" font-weight="700"');
      text(zh?'烟雾时序预测':'Smoke time-series prediction',800,686,25,'text-anchor="middle" font-weight="700"');
      text(zh?'烟雾采样  →  时序预测  →  阈值调节  →  分级报警':'Sampling  →  Prediction  →  Adaptive threshold  →  Alarm',540,751,25,'text-anchor="middle" fill="#526572"');
    }
    return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${target[0]}" height="${target[1]}" viewBox="0 0 1080 ${height}"><g font-family="Times New Roman, Microsoft YaHei, PingFang SC, serif" fill="#233946">${content.join('')}</g></svg>`,target};
  }
  const outputs = [];
  for (const project of ['intelcup-2026','nuedc-c','embedded-2025']) for (const lang of ['zh','en']) {
    const {svg,target} = cover(project,lang);
    const stem = path.join(source,project,`cover-${lang}`);
    await fs.mkdir(path.dirname(stem),{recursive:true});
    await fs.writeFile(stem+'.svg',svg);
    await sharp(Buffer.from(svg)).flatten({background:'white'}).jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(stem+'.jpg');
    outputs.push({project,lang,dimensions:target,path:path.relative(root,stem+'.jpg')});
  }
  console.log(JSON.stringify({covers:outputs}));
})();
