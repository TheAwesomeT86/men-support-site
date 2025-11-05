async function loadMembers() {
  try {
    const res = await fetch('assets/data/members.json', { cache: 'no-store' });
    const data = await res.json();
    const grid = document.getElementById('members-grid');
    grid.innerHTML = '';
    data.members.forEach(m => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <img src="${m.photo}" alt="${m.name}">
        <h3>${m.name}</h3>
        <p>${m.role}</p>
        <p>${m.bio}</p>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error('Failed to load members', e);
  }
}

document.addEventListener('DOMContentLoaded', loadMembers);
