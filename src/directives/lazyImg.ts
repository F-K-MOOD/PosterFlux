import type { Directive } from 'vue';

interface LazyImgHTMLElement extends HTMLElement {
  _lazyObserver?: IntersectionObserver;
}

const lazyImg: Directive<LazyImgHTMLElement, string> = {
  mounted(el, binding) {
    const imgSrc = binding.value;

    if (!imgSrc || typeof imgSrc !== 'string') {
      console.warn('v-lazy: invalid image source', imgSrc);
      return;
    }

    // 统一把真实地址放到 data-src，方便瀑布流在需要时预读/取值
    (el as HTMLImageElement).dataset.src = imgSrc;

    if (!window.IntersectionObserver) {
      el.setAttribute('src', imgSrc);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = el as HTMLImageElement;
          img.crossOrigin = 'anonymous';
          img.setAttribute('src', imgSrc);
          
          img.onerror = () => {
            console.warn('图片加载失败:', imgSrc);
            el.classList.add('lazy-load-error');
          };
          
          observer.unobserve(el);
          el._lazyObserver = undefined;
        }
      });
    }, {
      rootMargin: '50px'
    });

    el._lazyObserver = observer;
    observer.observe(el);
  },

  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      const img = el as HTMLImageElement;
      img.dataset.src = binding.value;
      img.crossOrigin = 'anonymous';
      // 变更地址时恢复为“待懒加载”状态：先移除旧 src，再重新观察
      img.removeAttribute('src');

      // 如果之前有 observer，先清理
      if (el._lazyObserver) {
        el._lazyObserver.unobserve(el);
        el._lazyObserver = undefined;
      }

      if (!window.IntersectionObserver) {
        img.setAttribute('src', binding.value);
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.crossOrigin = 'anonymous';
            img.setAttribute('src', binding.value);
            observer.unobserve(el);
            el._lazyObserver = undefined;
          }
        });
      }, {
        rootMargin: '50px'
      });

      el._lazyObserver = observer;
      observer.observe(el);
    }
  },

  unmounted(el) {
    if (el._lazyObserver) {
      el._lazyObserver.unobserve(el);
      delete el._lazyObserver;
    }
  }
};

export default lazyImg;