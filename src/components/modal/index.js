import Modal from './modal.svelte'
// import ModalCard from './ModalCard.svelte'

Modal.open = open
// ModalCard.open = open

export { Modal }
// export { ModalCard }

export function open(props) {
  console.log('Modal open', props);
  const modal = new Modal({
    target: document.body,
    props,
    intro: true
  });

  modal.close = () => modal.$destroy();

  return modal;
}
