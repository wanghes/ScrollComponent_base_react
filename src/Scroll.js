import React, { Component } from 'react';

import './App.css';
//http://api.mntools.xyz/articles?offset=10&pagesize=10

class Scroll extends Component {
    static XLSX = "下拉刷新";
    static SKJZ = '松开加载';
    static GDJZGD = "滚动加载更多";
    static JZZ = "正在加载数据，请稍后...";
    static PullDownValve = 50;
    static ScrollLoadValve = 50;


    constructor(props, context) {
        super(props);
        this.state = {
            translate: 0, // 位移
            pullRefreshing: false, //下拉刷新中
            scrollLoading: false, //滚动加载更多中
            enablePullRefresh: true, //下拉刷新
            enableScrollLoadMore: true, //滚动加载更多
            data:[]
        };
        this.dropDownRefreshText = Scroll.XLSX;
        this.initPullRefresh = this.initPullRefresh.bind(this);
        this.initScrollLoadMore = this.initScrollLoadMore.bind(this);
    }

    componentDidMount() {
        this.setState({
            translate: 0,
            enablePullRefresh: this.props.enablePullRefresh,
            enableScrollLoadMore: this.props.enableScrollLoadMore
        });
        this.initPullRefresh();
        this.initScrollLoadMore();
    }

    initPullRefresh() {
        let self = this;
        let isTouchStart = false; //是否已经触发下拉条件
        let isTouchMove = false; // 是否已经开始下拉
        let startX, startY;
        let supportTouch = 'ontouchstart' in window;

        if (this.state.enablePullRefresh) {
            this.refs.scroller.addEventListener('touchstart', touchStart, false);
            this.refs.scroller.addEventListener('touchmove', touchMove, false);
            this.refs.scroller.addEventListener('touchend', touchEnd, false);
            this.refs.scroller.addEventListener('mousedown', touchStart, false);
            this.refs.scroller.addEventListener('mousemove', touchMove, false);
            this.refs.scroller.addEventListener('mouseup', touchEnd, false);
        }

        function touchStart(event) {
            if (self.refs.scroller.scrollTop < 0) {
                isTouchStart = true;
                startX = supportTouch ? event.changedTouches[0].pageX : event.pageX;
                startY = supportTouch ? event.changedTouches[0].pageY : event.pageY;
            }
        }

        function touchMove(event) {
            if (!isTouchStart) {
                return;
            }
            let distanceY = supportTouch ? event.changedTouches[0].pageY - startY : event.pageY - startY;
            let distanceX = supportTouch ? event.changedTouches[0].pageX - startX : event.pageX - startX;
            if (distanceX > distanceY) {
                // console.log(distanceX, distanceY);
                return;
            }

            if (distanceY > 0) {
                self.setState({
                    translate: Math.pow((supportTouch ? event.changedTouches[0].pageY : event.pageY) - startY, 0.85)
                });
            } else {
                if (self.state.translate !== 0) {
                    self.setState({
                        translate: 0
                    });
                    self.transformScroller(0, self.state.translate);
                }
            }

            if (distanceY > 0) {
                if (!isTouchMove) {
                    isTouchMove = true;
                }

                if (self.state.translate <= Scroll.PullDownValve) { // 下拉中，但还没到刷新阀值
                    if (self.dropDownRefreshText !== Scroll.XLSX) {
                        self.refs.dropDownRefreshText.innerHTML = (self.dropDownRefreshText = Scroll.XLSX);
                    }
                } else { // 下拉中，已经达到刷新阀值
                    if (self.dropDownRefreshText !== Scroll.SKJZ) {
                        self.refs.dropDownRefreshText.innerHTML = (self.dropDownRefreshText = Scroll.SKJZ);
                    }
                }
                self.transformScroller(0, self.state.translate);
            }
        }

        function touchEnd() {
            isTouchMove = false;
            if (!isTouchStart) return;
            isTouchStart = false;
            if (self.state.translate < Scroll.PullDownValve) {
                self.transformScroller(0.3, 0); //设置在下拉刷新状态中
               
            } else {
                self.setState({
                    pullRefreshing: true
                });
                self.transformScroller(0.6, 0);
                self.refs.dropDownRefreshText.innerHTML = (this.dropDownRefreshText = Scroll.JZZ);
                self.props.onRefresh(); // 触发冲外面传进来的刷新回调函数
            }
        }
    }

    initScrollLoadMore() {
        var self = this;
        let timeoutId = null;
        if (this.state.enableScrollLoadMore) {
            self.refs.scroller.addEventListener('scroll', scrolling, false);
        }

        function callback() {

            //获取到按钮离顶部的距离
            var wrapper = document.querySelector('.scroll-loading');
            const top = wrapper.getBoundingClientRect().top
            const windowHeight = window.screen.height

            if (top && top < windowHeight) {
                // 证明 wrapper 已经被滚动到暴露在页面可视范围之内了
                self.setState({scrollLoading: true});
                self.props.onLoadMore();
            }
        }
        
        function scrolling() {
            console.log(1);
            if (self.props.over) return;

            if (self.state.scrollLoading) {
                return
            }

            if (timeoutId) {
                window.clearTimeout(timeoutId)
            }
           

            //如果在50ms 以内没有执行scroll 就会执行callBack，如果有下一次滚动，定时器就会被清空
            timeoutId = setTimeout(callback, 50);
            /*

            if (self.state.scrollLoading) return;
            var scrollerscrollHeight = self.refs.scroller.scrollHeight; // 容器滚动总高度
            var scrollerHeight = self.refs.scroller.getBoundingClientRect().height;// 容器滚动可见高度
            var scrollerTop = self.refs.scroller.scrollTop;//滚过的高度
            // 达到滚动加载阀值
            if (scrollerscrollHeight - scrollerHeight - scrollerTop <= Scroll.ScrollLoadValve) {
                self.setState({scrollLoading: true});
                self.props.onLoadMore();
            }
            */
        }
    }


    /**
     * 利用 transition 和transform  改变位移
     * @param time 时间
     * @param translate  距离
     */
    transformScroller(time, translate) {
        this.setState({translate: translate});
        var elStyle = this.refs.scroller.style;
        elStyle.webkitTransition = elStyle.MozTransition = elStyle.transition = 'all ' + time + 's ease-in-out';
        elStyle.webkitTransform = elStyle.MozTransform = elStyle.transform = 'translate3d(0, ' + translate + 'px, 0)';
    }



    /**
     * 下拉刷新完毕
     */
    pullRefreshingDone() {
        this.setState({pullRefreshing: false});
        this.transformScroller(0.1, 0);
    }

    /**
     * 滚动加载完毕
     */
    scrollLoadingDone() {
        this.setState({scrollLoading: false});
        this.refs.dropDownRefreshText.innerHTML = (this.dropDownRefreshText = Scroll.XLJZ);
    }

    /**
     * 当有新的属性需要更新时。也就是网络数据回来之后
     * @param nextProps
     */
    componentWillReceiveProps(nextProps) {
        var self = this;
        this.setState({data: nextProps.article,});//把新的数据填进列表
        if (this.state.pullRefreshing) {//如果之前是下拉刷新状态，恢复
            setTimeout(function () {
                self.pullRefreshingDone();
            }, 1000);
        }
        if (this.state.scrollLoading) {//如果之前是滚动加载状态，恢复
            setTimeout(function () {
                self.scrollLoadingDone();
            }, 1000);
        }
    }



    render() {
        const { data } = this.state;
        const { getItem, over } = this.props;
        const LoadingSatatusTxt = () => {
            return over ? (<div className="scroll-loading">加载完成</div>) : (<div className="scroll-loading">{ Scroll.JZZ }</div>)
        };
        
        return (
            <div className="scroller" ref="scroller">
                <div className="drop-down-refresh-layer">
                    <p className="drop-down-refresh-text" ref="dropDownRefreshText">下拉加载</p>
                </div>
                <div className="scroller-content">
                    <div className="content">
                        <ul className="left_four_ul" id="list">
                            {
                                data.map(function (item) {//通过map循环把子列表数据展示出来
                                    return getItem(item);
                                })
                            }
                        </ul>
                    </div>
                    <LoadingSatatusTxt />
                </div>
            </div>
        );
    }
}


export default Scroll;
