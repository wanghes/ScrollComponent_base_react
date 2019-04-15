import React, { Component } from 'react';
import './App.css';
import Scroll from './Scroll';


class Item extends Component {
    render() {
        const { id } = this.props
        return (
            <li className="left_four_ul_li" onClick={ (e) => {alert(id)}}>
                <div className="left_four_ul_li_para">
                    <h1>{this.props.article.content}</h1>
                </div>
            </li>
        );
    }
};


class App extends Component {
    constructor(props, context) {
        super(props);
        this.state = {
            over: false,
            page: 1,
            article: [] //文章列表
        };
        this.onLoadMore = this.onLoadMore.bind(this);
        this.onRefresh = this.onRefresh.bind(this);
    }

    componentDidMount() {//组件被加载之后，默认加载第一页数据
        this.getData(1);
    }

    onRefresh() {//下拉刷新函数
        this.setState({page: 1});
        this.getData(this.state.page);
    }
    onLoadMore() {//加载更多函数
        var page = this.state.page + 1;
        this.setState({page: page});
        this.getData(page);
    }

    getItem(article) {
        let id = Math.ceil((Math.random()* 10000000));
        return <Item key={ id } id={id}  article={article}/>;
    }
    getData(page) {//获取数据的函数
        var self = this;
        fetch("http://api.mntools.xyz/articles?offset="+ ((page-1) * 10) +"&pageSize=20").then((response) => {
            return response.json();
        }).then(data => {
            // data就是我们请求的repos
            if (page === 1) {//如果是第一页，直接覆盖之前的数据
                self.setState({ article: data.data, over: false })
                //父组件的setState  改变的自己的状态的同时触发了自组件的componentWillReceiveProps
                //子组件可以在componentWillReceiveProps里接受新的参数，改变自己的state会自动触发render渲染
            } else {
                let over = false;
                if (!data.data.length || data.data.length < 20) {
                    over = true;
                }
                self.setState({//否则累加数组
                    article: self.state.article.concat(data.data),
                    over: over
                });
            }
        });

    }
    render() {
        return (
            <div className="App">
                <Scroll
                    over={this.state.over}
                    onLoadMore = { this.onLoadMore }
                    onRefresh = { this.onRefresh }
                    article = {this.state.article}
                    getItem={ this.getItem } 
                />
            </div>
        );
    }
}

export default App;
