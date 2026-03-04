// TheLifeCo — Shared JavaScript
document.addEventListener('DOMContentLoaded',()=>{
  // Mobile nav toggle
  const navToggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.nav');
  if(navToggle){
    navToggle.addEventListener('click',()=>nav.classList.toggle('open'));
    document.addEventListener('click',(e)=>{
      if(!nav.contains(e.target))nav.classList.remove('open');
    });
  }

  // Tab switching
  document.querySelectorAll('.tabs').forEach(tabs=>{
    tabs.querySelectorAll('.tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        tabs.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        // If tabs have data-target, show corresponding content
        const target=tab.dataset.target;
        if(target){
          const parent=tabs.closest('section')||document;
          parent.querySelectorAll('.tab-content').forEach(c=>c.style.display='none');
          const el=parent.querySelector(target);
          if(el)el.style.display='';
        }
      });
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(q=>{
    q.addEventListener('click',()=>{
      const item=q.parentElement;
      const wasActive=item.classList.contains('active');
      // Close siblings
      const container=item.closest('.faq-list')||item.parentElement;
      container.querySelectorAll('.faq-item').forEach(i=>i.classList.remove('active'));
      if(!wasActive)item.classList.add('active');
    });
  });

  // Filter pills
  document.querySelectorAll('.filter-pills').forEach(pills=>{
    pills.querySelectorAll('.pill').forEach(pill=>{
      pill.addEventListener('click',()=>{
        pills.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  });

  // Category sidebar
  document.querySelectorAll('.category-item').forEach(item=>{
    item.addEventListener('click',()=>{
      document.querySelectorAll('.category-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Resort tab switcher (resort.html)
  // Decodes HTML entities from data attributes safely via a detached textarea
  function decodeHTMLEntities(str){
    const ta=document.createElement('textarea');
    ta.textContent=str;
    return ta.value;
  }
  const resortTabs = document.querySelectorAll('.resort-tab');
  if(resortTabs.length){
    resortTabs.forEach(tab=>{
      tab.addEventListener('click',()=>{
        resortTabs.forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        const resort=tab.dataset.resort;
        const name=decodeHTMLEntities(tab.dataset.name||'');
        const desc=tab.dataset.desc;
        const link=tab.dataset.link;
        const tabLabel=tab.textContent.trim();
        const imgEl=document.getElementById('resort-featured-img');
        const nameEl=document.getElementById('resort-featured-name');
        const descEl=document.getElementById('resort-featured-desc');
        const linkEl=document.getElementById('resort-featured-link');
        const tagEl=document.getElementById('resort-featured-tag');
        const amenityEl=document.getElementById('resort-featured-amenities');
        if(imgEl)imgEl.dataset.resort=resort;
        if(nameEl)nameEl.textContent=name;
        if(descEl)descEl.textContent=desc;
        if(tagEl)tagEl.textContent=tabLabel;
        // Rebuild amenities list using safe DOM methods
        if(amenityEl){
          while(amenityEl.firstChild)amenityEl.removeChild(amenityEl.firstChild);
          // Build default amenities per resort
          const amenityMap={
            Turkey:['Salt Room Therapy','Hammam','Aegean Sea Views','Medical Centre'],
            Thailand:['Jungle Lake Views','Yoga Pavilion','Outdoor Spa','Tropical Gardens'],
            Egypt:['Red Sea Views','Desert Landscape','Coral Reef Access','Wellness Spa'],
            Caribbean:['Volcanic Mineral Baths','Rainforest Setting','Beach Access','Island Serenity']
          };
          const list=amenityMap[resort]||[];
          list.forEach(function(a){
            const span=document.createElement('span');
            span.className='resort-featured-amenity';
            const icon=document.createElement('i');
            icon.className='fa-solid fa-circle-check';
            span.appendChild(icon);
            span.appendChild(document.createTextNode(' '+a));
            amenityEl.appendChild(span);
          });
        }
        if(linkEl){
          linkEl.href=link;
          while(linkEl.firstChild)linkEl.removeChild(linkEl.firstChild);
          linkEl.appendChild(document.createTextNode('Explore '+name+' '));
          const icon=document.createElement('i');
          icon.className='fa-solid fa-arrow-right';
          linkEl.appendChild(icon);
        }
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',(e)=>{
      const target=document.querySelector(a.getAttribute('href'));
      if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
    });
  });

  // Scroll-based nav background
  const navEl=document.querySelector('.nav:not(.nav--dark)');
  if(navEl){
    window.addEventListener('scroll',()=>{
      navEl.classList.toggle('nav--scrolled',window.scrollY>80);
    });
  }
});
