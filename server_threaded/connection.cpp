//
// connection.cpp
// ~~~~~~~~~~~~~~
//
// Copyright (c) 2003-2015 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#include "connection.hpp"
#include <utility>
#include <vector>
#include <functional>
#include "request_handler.hpp"

namespace http {
	namespace server {

		connection::connection(asio::io_service& service, request_handler& handler)
			:strand_(service),
			socket_(service),
			request_handler_(handler)
		{
		}

		asio::ip::tcp::socket& connection::socket()
		{
			return socket_;
		}

		void connection::start()
		{
			do_read();
		}

		void connection::stop()
		{
			socket_.close();
		}

		void connection::do_read()
		{
			auto self(shared_from_this());
			socket_.async_read_some(asio::buffer(buffer_),
				strand_.wrap([this, self](std::error_code ec, std::size_t bytes_transferred)
			{
				if (!ec)
				{
					request_parser::result_type result;
					std::tie(result, std::ignore) = request_parser_.parse(
						request_, buffer_.data(), buffer_.data() + bytes_transferred);

					if (result == request_parser::good)
					{
						request_handler_.handle_request(request_, reply_);
						do_write();
					}
					else if (result == request_parser::bad)
					{
						reply_ = reply::stock_reply(reply::bad_request);
						do_write();
					}
					else
					{
						do_read();
					}
				}
				else if (ec != asio::error::operation_aborted)
				{
					do_write();
				}
			}));
		}

		void connection::do_write()
		{
			auto self(shared_from_this());
			asio::async_write(socket_, reply_.to_buffers(),
				strand_.wrap([this, self](std::error_code ec, std::size_t)
			{
				if (!ec)
				{
					// Initiate graceful connection closure.
					asio::error_code ignored_ec;
					socket_.shutdown(asio::ip::tcp::socket::shutdown_both,
						ignored_ec);
				}
			}));
		}

	} // namespace server
} // namespace http
